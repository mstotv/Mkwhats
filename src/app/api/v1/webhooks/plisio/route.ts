import crypto from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Verify Plisio callback signature using HMAC-SHA1
 *
 * Official Plisio API verification:
 * 1. Extract verify_hash from payload and remove it from data object.
 * 2. Sort keys of remaining object alphabetically (ksort).
 * 3. Serialize sorted object to JSON string.
 * 4. Compute HMAC-SHA1 with Plisio SECRET_KEY.
 * 5. Compare computed hash with verify_hash.
 */
function verifyPlisioSignature(
  payload: Record<string, any>,
  secretKey: string
): boolean {
  if (!payload || !payload.verify_hash || !secretKey) return false

  const verifyHash = String(payload.verify_hash)
  const data = { ...payload }
  delete data.verify_hash

  // Sort keys alphabetically
  const sortedKeys = Object.keys(data).sort()
  const orderedData: Record<string, any> = {}
  for (const key of sortedKeys) {
    orderedData[key] = data[key]
  }

  const serialized = JSON.stringify(orderedData)

  const calculatedHash = crypto
    .createHmac('sha1', secretKey)
    .update(serialized)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(calculatedHash),
      Buffer.from(verifyHash)
    )
  } catch {
    return calculatedHash.toLowerCase() === verifyHash.toLowerCase()
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse JSON body (Plisio sends JSON when callback_url contains ?json=true)
    const payload = await request.json().catch(() => null)

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { error: 'Invalid or missing JSON payload' },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // 2. Fetch Plisio Secret Key from site_settings
    const { data: settings } = await serviceClient
      .from('site_settings')
      .select('plisio_secret_key, plisio_api_key, plisio_enabled')
      .limit(1)
      .maybeSingle()

    const secretKey = settings?.plisio_secret_key || settings?.plisio_api_key

    if (!secretKey) {
      console.error('[PlisioWebhook] Missing plisio_api_key in site_settings')
      return NextResponse.json(
        { error: 'Plisio gateway not configured on server' },
        { status: 500 }
      )
    }

    // 3. Verify HMAC-SHA1 signature
    const isValidSignature = verifyPlisioSignature(payload, secretKey)
    if (!isValidSignature) {
      console.error('[PlisioWebhook] Invalid signature verification hash:', {
        received: payload.verify_hash,
      })
      return NextResponse.json(
        { error: 'Forbidden: Invalid verify_hash signature' },
        { status: 403 }
      )
    }

    // 4. Extract invoice payment details from Plisio payload
    const invoiceId = payload.txn_id || payload.id
    const orderNumber = payload.order_number || payload.order_id
    const plisioStatus = String(payload.status || '').toLowerCase()
    const amountPaid = Number(payload.amount || payload.source_amount || 0)
    const currency = String(payload.currency || 'USDT').toUpperCase()

    console.log('[PlisioWebhook] Authenticated callback received:', {
      invoiceId,
      orderNumber,
      plisioStatus,
      amountPaid,
      currency,
    })

    // 5. Find corresponding upgrade request
    let query = serviceClient.from('upgrade_requests').select('*, plans:target_plan_id(*)')

    if (orderNumber) {
      query = query.eq('id', orderNumber)
    } else if (invoiceId) {
      query = query.eq('plisio_invoice_id', invoiceId)
    } else {
      return NextResponse.json(
        { error: 'Missing order_number or txn_id' },
        { status: 400 }
      )
    }

    const { data: upgradeReq, error: reqError } = await query.maybeSingle()

    if (reqError || !upgradeReq) {
      console.error('[PlisioWebhook] Upgrade request not found:', reqError)
      return NextResponse.json(
        { error: 'Upgrade request not found' },
        { status: 404 }
      )
    }

    // 6. Layer 2: Replay Attack Protection (already completed requests are ignored)
    if (upgradeReq.status === 'completed') {
      console.log('[PlisioWebhook] Request already completed. Skipping replay.')
      return NextResponse.json(
        { message: 'Already processed' },
        { status: 200 }
      )
    }

    // Update Plisio tracking status on upgrade request
    await serviceClient
      .from('upgrade_requests')
      .update({
        plisio_invoice_id: invoiceId || upgradeReq.plisio_invoice_id,
        plisio_status: plisioStatus,
        plisio_amount: amountPaid || upgradeReq.plisio_amount,
        plisio_currency: currency || upgradeReq.plisio_currency,
        updated_at: new Date().toISOString(),
      })
      .eq('id', upgradeReq.id)

    // 7. Check if payment is completed
    const isCompleted = plisioStatus === 'completed' || plisioStatus === 'mismatch'

    if (!isCompleted) {
      console.log(`[PlisioWebhook] Payment status is ${plisioStatus}. Waiting for network confirmation.`)
      return NextResponse.json({ status: 'pending_confirmation' }, { status: 200 })
    }

    // 8. Layer 3: Amount Validation
    const targetPlan = upgradeReq.plans
    const expectedPrice =
      upgradeReq.billing_cycle === 'yearly'
        ? (Number(targetPlan?.price_yearly_discounted) > 0 ? Number(targetPlan?.price_yearly_discounted) : Number(targetPlan?.price_yearly || 0))
        : (Number(targetPlan?.price_monthly_discounted) > 0 ? Number(targetPlan?.price_monthly_discounted) : Number(targetPlan?.price_monthly || 0))

    // Small floating point tolerance if needed
    if (amountPaid > 0 && amountPaid < expectedPrice - 0.5) {
      console.error('[PlisioWebhook] Underpaid invoice error:', {
        paid: amountPaid,
        expected: expectedPrice,
      })
      await serviceClient
        .from('upgrade_requests')
        .update({
          notes: `Underpaid: paid $${amountPaid}, required $${expectedPrice}`,
        })
        .eq('id', upgradeReq.id)

      return NextResponse.json(
        { error: 'Underpaid amount' },
        { status: 400 }
      )
    }

    const now = new Date()
    const periodEnd = new Date(now)
    if (upgradeReq.billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // 9. Mark upgrade request as completed
    await serviceClient
      .from('upgrade_requests')
      .update({
        status: 'completed',
        plisio_status: plisioStatus,
        paid_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', upgradeReq.id)

    // 10. Update accounts table plan_id
    await serviceClient
      .from('accounts')
      .update({ plan_id: upgradeReq.target_plan_id, updated_at: now.toISOString() })
      .eq('id', upgradeReq.account_id)

    // 11. Cancel current active subscription if exists
    const { data: currentSub } = await serviceClient
      .from('subscriptions')
      .select('id')
      .eq('account_id', upgradeReq.account_id)
      .in('status', ['active', 'trialing'])
      .maybeSingle()

    if (currentSub) {
      await serviceClient
        .from('subscriptions')
        .update({
          status: 'canceled',
          canceled_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', currentSub.id)
    }

    // 11. Create NEW active subscription row
    const { data: newSub, error: subInsertError } = await serviceClient
      .from('subscriptions')
      .insert({
        account_id: upgradeReq.account_id,
        plan_id: upgradeReq.target_plan_id,
        status: 'active',
        billing_cycle: upgradeReq.billing_cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select('id')
      .single()

    if (subInsertError) {
      console.error('[PlisioWebhook] Subscription insert error:', subInsertError)
      return NextResponse.json(
        { error: 'Failed to create subscription' },
        { status: 500 }
      )
    }

    console.log('[PlisioWebhook] Subscription created successfully:', newSub.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified and subscription activated successfully',
        subscription_id: newSub.id,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[PlisioWebhook] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Internal server error in webhook handler' },
      { status: 500 }
    )
  }
}
