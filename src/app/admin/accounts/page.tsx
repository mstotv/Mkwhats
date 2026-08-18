'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  Search,
  MoreVertical,
  ShieldBan,
  ShieldCheck,
  Users,
  MessageSquare,
  Loader2,
  RefreshCw,
  CreditCard,
  Check,
  Key,
  LogIn,
  Lock,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

import { useLocale } from 'next-intl';

interface AdminAccountRow {
  account_id: string;
  account_name: string;
  created_at: string;
  is_suspended: boolean;
  plan_id?: string;
  plan_name: string;
  plan_slug: string;
  subscription_status: string;
  user_count: number;
  message_count: number;
  owner_email: string;
  owner_user_id?: string;
}

interface PlanOption {
  id: string;
  name: string;
  slug: string;
}

export default function AdminAccountsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Change Plan Modal State
  const [changingAccount, setChangingAccount] = useState<AdminAccountRow | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Reset Password Modal State
  const [resettingAccount, setResettingAccount] = useState<AdminAccountRow | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPass, setResettingPass] = useState(false);

  // Delete Account Modal State
  const [deletingAccount, setDeletingAccount] = useState<AdminAccountRow | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Impersonating State
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  async function fetchAccountsAndPlans() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [accountsRes, plansRes] = await Promise.all([
        fetch('/api/admin/accounts')
          .then((r) => (r.ok ? r.json() : { accounts: [] }))
          .catch(() => ({ accounts: [] })),
        supabase.from('plans').select('id, name, slug').eq('is_active', true),
      ]);

      setAccounts((accountsRes.accounts as AdminAccountRow[]) ?? []);
      setPlans((plansRes.data as PlanOption[]) ?? []);
    } catch (err) {
      console.error('[AdminAccounts] Error fetching data:', err);
      toast.error('تعذر تحميل بيانات الشركات والخطط');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccountsAndPlans();
  }, []);

  async function handleToggleSuspension(accountId: string, currentSuspended: boolean) {
    try {
      setProcessingId(accountId);
      const supabase = createClient();
      const newStatus = !currentSuspended;

      const { error } = await supabase.rpc('set_account_suspension_status', {
        target_account_id: accountId,
        new_suspended_status: newStatus,
      });

      if (error) throw error;

      toast.success(newStatus ? 'تم حظر الحساب بنجاح 🛑' : 'تم فك الحظر وإعادة تفعيل الحساب ✅');
      setAccounts((prev) =>
        prev.map((a) => (a.account_id === accountId ? { ...a, is_suspended: newStatus } : a)),
      );
    } catch (err) {
      console.error('[handleToggleSuspension] Error:', err);
      toast.error('فشلت عملية تغيير حالة الحساب');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleConfirmPlanChange() {
    if (!changingAccount || !selectedPlanId) return;

    try {
      setSavingPlan(true);
      const supabase = createClient();

      const { error } = await supabase.rpc('change_account_subscription_plan', {
        target_account_id: changingAccount.account_id,
        new_plan_id: selectedPlanId,
      });

      if (error) throw error;

      const targetPlan = plans.find((p) => p.id === selectedPlanId);
      toast.success(`تمت ترقية/تغيير باقة الشركة إلى "${targetPlan?.name}" بنجاح 🎉`);

      setAccounts((prev) =>
        prev.map((a) =>
          a.account_id === changingAccount.account_id
            ? { ...a, plan_id: selectedPlanId, plan_name: targetPlan?.name || a.plan_name }
            : a,
        ),
      );
      setChangingAccount(null);
    } catch (err) {
      console.error('[handleConfirmPlanChange] Error:', err);
      toast.error('فشلت عملية تغيير باقة الشركة');
    } finally {
      setSavingPlan(false);
    }
  }

  async function handleConfirmResetPassword() {
    if (!resettingAccount || !newPassword || newPassword.length < 6) {
      toast.error('يرجى كتابة كلمة مرور لا تقل عن 6 أحرف');
      return;
    }

    try {
      setResettingPass(true);
      const res = await fetch('/api/admin/accounts/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: resettingAccount.account_id,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور');

      toast.success(data.message || 'تم تغيير كلمة المرور بنجاح ✅');
      setResettingAccount(null);
      setNewPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل تغيير كلمة المرور';
      toast.error(msg);
    } finally {
      setResettingPass(false);
    }
  }

  async function handleImpersonateAccount(acc: AdminAccountRow) {
    try {
      setImpersonatingId(acc.account_id);
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_user_id: acc.owner_user_id || acc.account_id,
          target_account_id: acc.account_id,
          reason: 'دعم فني ومساعدة في الإعداد والتكوين',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل الدخول لحساب الشركة');

      toast.success(`جاري الانتقال لوحة تحكم شركة "${acc.account_name}" لمساعدتهم... 🚀`);
      window.location.href = '/dashboard';
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل الدخول لحساب الشركة';
      toast.error(msg);
      setImpersonatingId(null);
    }
  }

  async function handleDeleteAccountConfirm() {
    if (!deletingAccount) return;
    try {
      setConfirmingDelete(true);
      const res = await fetch('/api/admin/accounts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: deletingAccount.account_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حذف الحساب');

      toast.success(data.message || (isAr ? 'تم حذف الحساب بنجاح 🗑️' : 'Account deleted successfully'));
      setDeleteModalOpen(false);
      setDeletingAccount(null);
      fetchAccountsAndPlans();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ عند حذف الحساب' : 'Failed to delete account'));
    } finally {
      setConfirmingDelete(false);
    }
  }

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.account_name.toLowerCase().includes(search.toLowerCase()) ||
        acc.owner_email.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'active') return !acc.is_suspended;
      if (statusFilter === 'suspended') return acc.is_suspended;
      return true;
    });
  }, [accounts, search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {isAr ? 'إدارة الشركات والحسابات (Tenants Directory)' : 'Tenants & Accounts Directory'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isAr
              ? 'الدخول بحساب الشركة لمساعدتهم في الإعداد، حظر/تفعيل الحسابات، تغيير كلمات المرور، وتعديل الباقات'
              : 'Log into tenant accounts for support, suspend/activate accounts, reset passwords, and update plans.'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAccountsAndPlans}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
          {isAr ? 'تحديث القائمة' : 'Refresh Directory'}
        </Button>
      </div>

      {/* Change Plan Modal */}
      {changingAccount && (
        <div className="rounded-2xl border border-amber-500/40 bg-card p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">
              {isAr ? 'تغيير باقة شركة:' : 'Change Plan for:'} <span className="text-amber-500">{changingAccount.account_name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setChangingAccount(null)} className="text-xs">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="font-semibold text-foreground">
              {isAr ? 'اختر الباقة الجديدة للشركة:' : 'Select New Plan:'}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedPlanId === p.id
                      ? 'border-2 border-amber-500 bg-amber-500/10'
                      : 'border-border bg-background hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{p.name}</span>
                    {selectedPlanId === p.id && <Check className="h-4 w-4 text-amber-500" />}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground font-mono">{p.slug}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setChangingAccount(null)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPlanChange}
              disabled={savingPlan || !selectedPlanId}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {savingPlan ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              {isAr ? 'تأكيد تغيير الباقة' : 'Confirm Plan Change'}
            </Button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingAccount && (
        <div className="rounded-2xl border border-amber-500/40 bg-card p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              {isAr ? 'تغيير كلمة المرور لمالك شركة:' : 'Reset Password for:'} <span className="text-amber-500">{resettingAccount.account_name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setResettingAccount(null)} className="text-xs">
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              {isAr ? 'البريد المستهدف:' : 'Target Email:'} <strong className="text-foreground font-mono">{resettingAccount.owner_email}</strong>
            </p>
            <div className="space-y-1.5 max-w-md">
              <label className="font-semibold text-foreground">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={isAr ? 'أدخل كلمة مرور جديدة (مثلاً: Abc@123456)' : 'Enter new password (e.g. Abc@123456)'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="ps-9 bg-background border-border"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setResettingAccount(null)}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResetPassword}
              disabled={resettingPass || !newPassword}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {resettingPass ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              {isAr ? 'تأكيد حفظ كلمة المرور' : 'Confirm Save Password'}
            </Button>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={isAr ? 'البحث باسم الشركة أو بريد المالك...' : 'Search company name or owner email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 bg-background border-border text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="text-xs font-semibold"
          >
            {isAr ? 'الكل' : 'All'} ({accounts.length})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
            className="text-xs font-semibold"
          >
            {isAr ? 'النشطة' : 'Active'} ({accounts.filter((a) => !a.is_suspended).length})
          </Button>
          <Button
            variant={statusFilter === 'suspended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('suspended')}
            className="text-xs font-semibold text-red-400"
          >
            {isAr ? 'المحظورة' : 'Suspended'} ({accounts.filter((a) => a.is_suspended).length})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">{isAr ? 'جاري تحميل الشركات...' : 'Loading accounts...'}</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs font-medium">
              {isAr ? 'لم يتم العثور على أي شركات تطابق نتائج البحث.' : 'No accounts match the search criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'اسم الشركة' : 'Company Name'}</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'مالك الحساب' : 'Account Owner'}</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'الباقة الحالية' : 'Current Plan'}</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'المستخدمون' : 'Users'}</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'الرسائل' : 'Messages'}</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'حالة الحساب' : 'Status'}</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">{isAr ? 'تاريخ التسجيل' : 'Registered Date'}</TableHead>
                  <TableHead className="text-end text-xs font-bold text-muted-foreground">{isAr ? 'إجراءات التحكم' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredAccounts.map((acc) => (
                  <TableRow key={acc.account_id} className="border-border hover:bg-muted/40">
                    <TableCell className="text-start font-bold text-foreground">
                      {acc.account_name}
                    </TableCell>
                    <TableCell className="text-start text-xs text-muted-foreground dir-ltr">
                      {acc.owner_email}
                    </TableCell>
                    <TableCell className="text-start">
                      <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                        {acc.plan_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-start text-xs font-medium text-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {acc.user_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-start text-xs font-medium text-foreground">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                        {acc.message_count.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-start">
                      {acc.is_suspended ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-bold text-red-400">
                          🛑 {isAr ? 'محظور' : 'Suspended'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                          ✅ {isAr ? 'نشط' : 'Active'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-start text-xs text-muted-foreground">
                      {new Date(acc.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                    </TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-72 border-border/80 bg-card/95 backdrop-blur-md p-2 shadow-2xl space-y-1">
                          <DropdownMenuItem
                            onClick={() => handleImpersonateAccount(acc)}
                            disabled={impersonatingId === acc.account_id}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg text-blue-400 hover:bg-blue-500/10 cursor-pointer font-bold"
                          >
                            <div className="flex items-center gap-2.5">
                              <LogIn className="h-4 w-4 text-blue-400 shrink-0" />
                              <div className="flex flex-col text-start">
                                <span className="text-xs font-bold text-blue-400">
                                  {isAr ? 'الدخول لحساب الشركة' : 'Impersonate Account'}
                                </span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {isAr ? 'تقديم الدعم الفني وتسهيل التكوين' : 'Provide support & assist setup'}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => setResettingAccount(acc)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg text-amber-400 hover:bg-amber-500/10 cursor-pointer font-bold"
                          >
                            <div className="flex items-center gap-2.5">
                              <Key className="h-4 w-4 text-amber-400 shrink-0" />
                              <div className="flex flex-col text-start">
                                <span className="text-xs font-bold text-amber-400">
                                  {isAr ? 'تغيير كلمة المرور' : 'Reset Password'}
                                </span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {isAr ? 'تعيين كلمة مرور جديدة للمالك' : 'Set a new password for owner'}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setChangingAccount(acc);
                              setSelectedPlanId(acc.plan_id || '');
                            }}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer font-bold"
                          >
                            <div className="flex items-center gap-2.5">
                              <CreditCard className="h-4 w-4 text-amber-500 shrink-0" />
                              <div className="flex flex-col text-start">
                                <span className="text-xs font-bold text-amber-500">
                                  {isAr ? 'تغيير الباقة والاشتراك' : 'Change Plan & Subscription'}
                                </span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {isAr ? 'ترقية أو تعديل خطة الاشتراك' : 'Upgrade or modify subscription plan'}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleToggleSuspension(acc.account_id, acc.is_suspended)}
                            disabled={processingId === acc.account_id}
                            className={`flex items-center justify-between gap-3 p-2.5 rounded-lg cursor-pointer font-bold ${
                              acc.is_suspended
                                ? 'text-emerald-400 hover:bg-emerald-500/10'
                                : 'text-red-400 hover:bg-red-500/10'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {acc.is_suspended ? (
                                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                              ) : (
                                <ShieldBan className="h-4 w-4 text-red-400 shrink-0" />
                              )}
                              <div className="flex flex-col text-start">
                                <span className="text-xs font-bold">
                                  {acc.is_suspended
                                    ? isAr ? 'رفع الحظر عن الحساب' : 'Reinstate Account'
                                    : isAr ? 'حظر الحساب فوراً' : 'Suspend Account Immediately'}
                                </span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {acc.is_suspended
                                    ? isAr ? 'إعادة تفعيل صلاحيات الدخول' : 'Re-enable login access'
                                    : isAr ? 'إيقاف وتعطيل وصول العميل' : 'Disable customer access'}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>

                          {/* DELETE ACCOUNT ACTION */}
                          <DropdownMenuItem
                            onClick={() => {
                              setDeletingAccount(acc);
                              setDeleteModalOpen(true);
                            }}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer font-bold border-t border-border/50"
                          >
                            <div className="flex items-center gap-2.5">
                              <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                              <div className="flex flex-col text-start">
                                <span className="text-xs font-bold text-rose-500">
                                  {isAr ? 'حذف الحساب نهائياً' : 'Delete Account Permanently'}
                                </span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {isAr ? 'حذف الحساب ومستخدميه من DB' : 'Permanently delete account from DB'}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* DELETE ACCOUNT CONFIRMATION DIALOG */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="h-5 w-5" />
              {isAr ? 'تأكيد حذف الحساب نهائياً ⚠️' : 'Confirm Account Deletion'}
            </DialogTitle>
          </DialogHeader>

          {deletingAccount && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1 text-rose-700 dark:text-rose-300">
                <div className="font-bold text-sm">{deletingAccount.account_name}</div>
                <div className="text-xs font-mono">{deletingAccount.owner_email}</div>
              </div>

              <p className="text-muted-foreground text-xs leading-relaxed font-bold">
                {isAr
                  ? '⚠️ تحذير أمني شديد: هذا الإجراء سيقوم بحذف الحساب وجميع سجلاته ورسائله واشتراكاته وحساب المستخدم من قاعدة البيانات (Supabase DB & Auth) نهائياً، ولا يمكن استرجاع هذه البيانات إطلاقاً!'
                  : 'Warning: This action will permanently delete the account, all associated messages, contacts, subscriptions, and auth users from the database. This cannot be undone.'}
              </p>

              <DialogFooter className="pt-2 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  className="rounded-2xl h-11 font-bold flex-1"
                >
                  {isAr ? 'إلغاء الإجراء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleDeleteAccountConfirm}
                  disabled={confirmingDelete}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl h-11 px-5 flex-1 shadow-lg shadow-rose-600/20"
                >
                  {confirmingDelete ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    isAr ? 'تأكيد الحذف النهائي 🗑️' : 'Delete Permanently'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
