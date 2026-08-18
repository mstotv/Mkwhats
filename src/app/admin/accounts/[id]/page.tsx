import { createServiceClient } from '@/lib/supabase/service'
import { AccountMembersTable, type MemberItem } from '../../_components/account-members-table'
import { AccountStatusToggle } from '../../_components/account-status-toggle'
import { AccountSubscriptionCard } from '../../_components/account-subscription-card'
import {
  Building2,
  Users,
  Calendar,
  ArrowRight,
  Shield,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminAccountDetailsPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  // 1. Fetch account details
  const { data: account, error: accountError } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (accountError || !account) {
    notFound()
  }

  // 2. Fetch active/trialing subscription for this account
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('account_id', id)
    .in('status', ['active', 'trialing'])
    .maybeSingle()

  // 3. Fetch all active plans
  const { data: availablePlans } = await supabase
    .from('plans')
    .select('*')
    .order('price_monthly', { ascending: true })

  // 4. Fetch profiles (members) for this account
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, account_role, created_at')
    .eq('account_id', id)
    .order('created_at', { ascending: true })

  // 3. Targeted fetch of last_sign_in_at for only members of this account
  const members: MemberItem[] = await Promise.all(
    (profiles || []).map(async (p) => {
      try {
        const { data: authUser } = await supabase.auth.admin.getUserById(p.user_id)
        return {
          ...p,
          last_sign_in_at: authUser?.user?.last_sign_in_at || null,
        }
      } catch {
        return {
          ...p,
          last_sign_in_at: null,
        }
      }
    })
  )

  return (
    <div className="space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/admin/accounts"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            العودة إلى قائمة الحسابات
          </Link>
        </div>

        {/* Account Details Header Card - Stripe Style */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/60 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-200">
                <Building2 className="h-6 w-6 text-slate-300" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-50 tracking-tight">
                    {account.name}
                  </h1>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      account.status === 'suspended'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : account.status === 'trial'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : account.status === 'cancelled'
                        ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {account.status === 'suspended'
                      ? 'معلق'
                      : account.status === 'trial'
                      ? 'تجريبي'
                      : account.status === 'cancelled'
                      ? 'ملغى'
                      : 'نشط'}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  ID: {account.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-950/60 border border-slate-800/80 px-3 py-1.5 text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {members.length} عضو مسجل
              </span>

              {/* Suspend / Reactivate Status Toggle Component */}
              <AccountStatusToggle
                accountId={account.id}
                accountName={account.name}
                currentStatus={account.status || 'active'}
              />
            </div>
          </div>

          {/* Account Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                تاريخ إنشاء الحساب
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {new Date(account.created_at).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-500" />
                معرّف مالك الحساب
              </span>
              <p className="text-xs font-mono text-slate-400 truncate">
                {account.owner_user_id}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                آخر تحديث للحساب
              </span>
              <p className="text-sm font-semibold text-slate-200">
                {new Date(account.updated_at).toLocaleDateString('ar-SA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Info Card */}
        <AccountSubscriptionCard
          accountId={account.id}
          subscription={subscription}
          availablePlans={availablePlans || []}
        />

        {/* Members Table Card - Stripe Style */}
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 shadow-sm overflow-hidden space-y-0">
          <div className="p-5 border-b border-slate-800/60 bg-slate-950/20 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                أعضاء الحساب (المستخدمين)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                قائمة جميع المستخدمين المسجلين في هذا الحساب وإمكانية تعديل بياناتهم
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-800/60">
              إجمالي: {members.length}
            </span>
          </div>

          <AccountMembersTable
            members={members}
            accountId={account.id}
            accountName={account.name}
          />
        </div>
      </div>
    )
  }
