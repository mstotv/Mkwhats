import { createServiceClient } from '@/lib/supabase/service'
import { AccountsClientPage } from './accounts-client'
import type { AccountItem } from '../_components/accounts-table'

export const revalidate = 0

export default async function AdminAccountsPage() {
  const supabase = createServiceClient()

  // 1. Fetch accounts
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })

  // 2. Fetch profiles to calculate member count per account
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('account_id')

  const memberCounts: Record<string, number> = {}
  if (profilesData) {
    profilesData.forEach((p) => {
      if (p.account_id) {
        memberCounts[p.account_id] = (memberCounts[p.account_id] || 0) + 1
      }
    })
  }

  const accounts: AccountItem[] = (accountsData || []).map((acc) => ({
    id: acc.id,
    name: acc.name,
    status: acc.status || 'active',
    created_at: acc.created_at,
    member_count: memberCounts[acc.id] || 0,
  }))

  return <AccountsClientPage accounts={accounts} />
}
