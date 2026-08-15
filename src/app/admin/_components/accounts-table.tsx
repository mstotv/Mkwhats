'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Building2, Users, Calendar, Hash, ChevronLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useTranslations, useLocale } from 'next-intl'

export interface AccountItem {
  id: string
  name: string
  status: string
  created_at: string
  member_count: number
}

interface AccountsTableProps {
  accounts: AccountItem[]
}

export function AccountsTable({ accounts }: AccountsTableProps) {
  const t = useTranslations('Admin.accounts')
  const locale = useLocale()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 font-sans">
      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 border-slate-800/60 bg-slate-900/60 text-slate-100 placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {t('showingAccounts', { count: filteredAccounts.length, total: accounts.length })}
        </div>
      </div>

      {/* Table Container - Stripe Style */}
      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs text-slate-300">
            <thead className="border-b border-slate-800/60 bg-slate-950/40 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    {t('thAccountName')}
                  </div>
                </th>
                <th className="py-3 px-5">{t('thStatus')}</th>
                <th className="py-3 px-5">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {t('thMembers')}
                  </div>
                </th>
                <th className="py-3 px-5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {t('thCreated')}
                  </div>
                </th>
                <th className="py-3 px-5">
                  <div className="flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-slate-500" />
                    {t('thId')}
                  </div>
                </th>
                <th className="py-3 px-5 text-left">{t('thDetails')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <tr
                    key={account.id}
                    className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                  >
                    <td className="py-3.5 px-5 font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        className="block w-full h-full"
                      >
                        {account.name}
                      </Link>
                    </td>

                    <td className="py-3.5 px-5">
                      <Link href={`/admin/accounts/${account.id}`}>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            account.status === 'suspended'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}
                        >
                          {account.status === 'suspended' ? t('suspended') : t('active')}
                        </span>
                      </Link>
                    </td>

                    <td className="py-3.5 px-5 text-slate-300 font-medium">
                      <Link href={`/admin/accounts/${account.id}`}>
                        {t('memberCount', { count: account.member_count })}
                      </Link>
                    </td>

                    <td className="py-3.5 px-5 text-slate-400" suppressHydrationWarning>
                      <Link href={`/admin/accounts/${account.id}`}>
                        {new Date(account.created_at).toLocaleDateString(
                          locale === 'ar' ? 'ar-EG' : 'en-US',
                          {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          }
                        )}
                      </Link>
                    </td>

                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px]">
                      <Link href={`/admin/accounts/${account.id}`}>
                        {account.id}
                      </Link>
                    </td>

                    <td className="py-3.5 px-5 text-left">
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors text-xs font-medium"
                      >
                        {t('view')}
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="h-8 w-8 text-slate-600" />
                      <p className="font-semibold text-sm">
                        لم يتم العثور على أي حساب يطابق البحث
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
