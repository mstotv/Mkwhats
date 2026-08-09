import { createServiceClient } from '@/lib/supabase/service'
import { AdminNav } from '../_components/admin-nav'
import { AccountsTable, type AccountItem } from '../_components/accounts-table'
import { Building2 } from 'lucide-react'

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <AdminNav />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-50 tracking-tight">
                قائمة حسابات المنصة
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              عرض واستعراض جميع الحسابات المسجلة بالمنصة وعدد الأعضاء التابعين لكل حساب
            </p>
          </div>
        </div>

        {/* Accounts Table Component */}
        <AccountsTable accounts={accounts} />
      </main>
    </div>
  )
}
