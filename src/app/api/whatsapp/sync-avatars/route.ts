import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchEvolutionProfilePictureUrl } from '@/lib/whatsapp/evolution-api'

export async function POST() {
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = authData.user.id
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', userId)
    .single()

  if (!profile?.account_id) {
    return NextResponse.json({ error: 'No account found' }, { status: 400 })
  }

  const accountId = profile.account_id

  // Fetch active Evolution WhatsApp configuration
  const { data: config } = await supabase
    .from('whatsapp_config')
    .select('*')
    .eq('account_id', accountId)
    .eq('connection_type', 'evolution')
    .maybeSingle()

  if (!config?.evolution_instance_name || !config?.evolution_api_key) {
    return NextResponse.json(
      { error: 'No connected Evolution instance' },
      { status: 400 }
    )
  }

  const instanceName = config.evolution_instance_name
  const instanceApiKey = config.evolution_api_key

  // Fetch contacts without avatar_url
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, phone')
    .eq('account_id', accountId)
    .is('avatar_url', null)
    .limit(50)

  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ updated: 0, message: 'All contacts already have avatars' })
  }

  let updatedCount = 0

  for (const c of contacts) {
    const avatarUrl = await fetchEvolutionProfilePictureUrl({
      instanceName,
      instanceApiKey,
      number: c.phone,
    })

    if (avatarUrl) {
      await supabase
        .from('contacts')
        .update({ avatar_url: avatarUrl })
        .eq('id', c.id)
      updatedCount++
    }
  }

  return NextResponse.json({
    updated: updatedCount,
    message: `Updated profile picture for ${updatedCount} contacts`,
  })
}
