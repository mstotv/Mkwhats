'use client'

import { AccountsTable, type AccountItem } from '../_components/accounts-table'
import { Building2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AccountsClientProps {
  accounts: AccountItem[]
}

export function AccountsClientPage({ accounts }: AccountsClientProps) {
  const t = useTranslations('Admin.accounts')

  return (
    <div className="space-y-6">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Building2 className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-50 tracking-tight">
                {t('title')}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {t('description')}
            </p>
          </div>
        </div>

        {/* Accounts Table Component */}
        <AccountsTable accounts={accounts} />
      </div>
    )
  }
