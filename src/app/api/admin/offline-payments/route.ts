import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { checkIsSuperAdmin } from '@/lib/auth/admin-guard';

export async function GET(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const serviceClient = createServiceClient();
    let query = serviceClient
      .from('offline_payment_submissions')
      .select('*, accounts(name), plans(name, slug), offline_payment_methods(name, account_number, logo_url)')
      .order('created_at', { ascending: false });

    if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AdminOfflinePayments] GET error:', error);
      return NextResponse.json({ submissions: [] });
    }

    return NextResponse.json({ submissions: data || [] });
  } catch (err) {
    console.error('[AdminOfflinePayments] GET Exception:', err);
    return NextResponse.json({ submissions: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await checkIsSuperAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { submission_id, action, admin_notes, custom_msg_ar, custom_msg_en } = body || {};

    if (!submission_id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'يرجى تقديم معرف المعاملة والإجراء المطلوب' }, { status: 400 });
    }

    const serviceClient = createServiceClient();
    const { data: submission, error: subError } = await serviceClient
      .from('offline_payment_submissions')
      .select('*')
      .eq('id', submission_id)
      .single();

    if (subError || !submission) {
      return NextResponse.json({ error: 'إثبات الدفع غير موجود' }, { status: 404 });
    }

    const now = new Date();
    const isApproved = action === 'approve';
    const newStatus = isApproved ? 'approved' : 'rejected';

    // 1. Update offline payment submission status
    const { error: updateSubErr } = await serviceClient
      .from('offline_payment_submissions')
      .update({
        status: newStatus,
        admin_notes: admin_notes || custom_msg_ar || null,
        reviewed_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', submission_id);

    if (updateSubErr) {
      console.error('[AdminOfflinePayments] Update submission error:', updateSubErr);
      return NextResponse.json({ error: 'فشل تحديث حالة إثبات الدفع' }, { status: 500 });
    }

    // 2. If APPROVED: Activate subscription plan in subscriptions table
    if (isApproved) {
      const periodEnd = new Date(now);
      if (submission.billing_cycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      // Check if existing active subscription exists for account
      const { data: existingSub } = await serviceClient
        .from('subscriptions')
        .select('id')
        .eq('account_id', submission.account_id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (existingSub) {
        await serviceClient
          .from('subscriptions')
          .update({
            plan_id: submission.plan_id,
            status: 'active',
            billing_cycle: submission.billing_cycle,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', existingSub.id);
      } else {
        await serviceClient
          .from('subscriptions')
          .insert({
            account_id: submission.account_id,
            plan_id: submission.plan_id,
            status: 'active',
            billing_cycle: submission.billing_cycle,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
          });
      }

      // Mark upgrade_requests for account as completed
      await serviceClient
        .from('upgrade_requests')
        .update({
          status: 'completed',
          updated_at: now.toISOString(),
        })
        .eq('account_id', submission.account_id)
        .eq('target_plan_id', submission.plan_id)
        .eq('status', 'pending');
    }

    // 3. Send official platform announcement, support ticket & bell notification to account
    try {
      const { data: targetPlan } = await serviceClient
        .from('plans')
        .select('name')
        .eq('id', submission.plan_id)
        .maybeSingle();

      const planName = targetPlan?.name || 'الباقة';

      const { data: accountProfiles } = await serviceClient
        .from('profiles')
        .select('user_id')
        .eq('account_id', submission.account_id);

      const recipientUserIds = new Set<string>();
      if (submission.user_id) recipientUserIds.add(submission.user_id);
      (accountProfiles || []).forEach((p: any) => {
        if (p.user_id) recipientUserIds.add(p.user_id);
      });

      const targetUserId = submission.user_id || accountProfiles?.[0]?.user_id;

      const notifTitle = isApproved
        ? `🎉 تم قبول إثبات الدفع وتفعيل باقة (${planName})!`
        : `⚠️ تم رفض طلب الدفع المحول لباقة (${planName})`;

      const defaultAr = isApproved
        ? `تهانينا! تم التحقق من إثبات الدفع وتفعيل باقة (${planName}) بنجاح لحسابك.`
        : `عذراً، تم رفض طلب الدفع المقدم لباقة (${planName}). ${admin_notes ? 'السبب: ' + admin_notes : 'يرجى مراجعة إثبات الدفع أو التواصل معنا.'}`;

      const defaultEn = isApproved
        ? `Congratulations! Your payment proof was verified and (${planName}) plan has been activated.`
        : `Regrettably, your payment submission was rejected. ${admin_notes ? 'Reason: ' + admin_notes : ''}`;

      const notifBodyAr = custom_msg_ar?.trim() || defaultAr;
      const notifBodyEn = custom_msg_en?.trim() || defaultEn;
      const combinedBody = `${notifBodyAr}\n\n----------------------------------------\n${notifBodyEn}`;

      // A. Insert into support_tickets (Platform Announcements 📢 & Support Tickets 🎫)
      if (targetUserId) {
        const { data: newTicket, error: ticketError } = await serviceClient
          .from('support_tickets')
          .insert({
            account_id: submission.account_id,
            user_id: targetUserId,
            subject: notifTitle,
            category: 'announcement',
            priority: isApproved ? 'high' : 'urgent',
            status: isApproved ? 'resolved' : 'open',
            is_announcement: true,
            is_read_by_user: false,
            last_reply_at: now.toISOString(),
          })
          .select()
          .single();

        if (ticketError) {
          console.error('[AdminOfflinePayments] Support ticket insert error:', ticketError);
        } else if (newTicket) {
          const { error: msgError } = await serviceClient.from('support_ticket_messages').insert({
            ticket_id: newTicket.id,
            sender_type: 'admin',
            sender_id: targetUserId,
            message_text: combinedBody,
          });

          if (msgError) {
            console.error('[AdminOfflinePayments] Support ticket message insert error:', msgError);
          }
        }
      }

      // B. Insert into notifications table (Header Bell 🔔 & /notifications page)
      const notifType = isApproved ? 'payment_approved' : 'payment_rejected';
      for (const uid of Array.from(recipientUserIds)) {
        const { error: notifInsErr } = await serviceClient.from('notifications').insert({
          account_id: submission.account_id,
          user_id: uid,
          type: notifType,
          title: notifTitle,
          body: notifBodyAr,
        });

        if (notifInsErr) {
          console.error('[AdminOfflinePayments] Notification row insert error:', notifInsErr);
        }
      }
    } catch (notifErr) {
      console.error('[AdminOfflinePayments] Support ticket notification error:', notifErr);
    }

    return NextResponse.json({
      success: true,
      message: isApproved ? 'تمت الموافقة على الدفع وتفعيل الباقة للمستخدم بنجاح 🚀' : 'تم رفض طلب الدفع بنجاح',
    });
  } catch (err) {
    console.error('[AdminOfflinePayments] POST Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
