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
} from 'lucide-react';
import { toast } from 'sonner';

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

  // Impersonating State
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  async function fetchAccountsAndPlans() {
    try {
      setLoading(true);
      const supabase = createClient();

      const [accountsRes, plansRes] = await Promise.all([
        fetch('/api/admin/accounts').then((r) => r.json()),
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
            إدارة الشركات والحسابات (Tenants Directory)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            الدخول بحساب الشركة لمساعدتهم في الإعداد، حظر/تفعيل الحسابات، تغيير كلمات المرور، وتعديل الباقات
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAccountsAndPlans}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث القائمة
        </Button>
      </div>

      {/* Change Plan Modal */}
      {changingAccount && (
        <div className="rounded-2xl border border-amber-500/40 bg-card p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-base font-bold text-foreground">
              تغيير باقة شركة: <span className="text-amber-500">{changingAccount.account_name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setChangingAccount(null)} className="text-xs">
              إلغاء
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <label className="font-semibold text-foreground">اختر الباقة الجديدة للشركة:</label>
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
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmPlanChange}
              disabled={savingPlan || !selectedPlanId}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {savingPlan ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              تأكيد تغيير الباقة
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
              تغيير كلمة المرور لمالك شركة: <span className="text-amber-500">{resettingAccount.account_name}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setResettingAccount(null)} className="text-xs">
              إلغاء
            </Button>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-muted-foreground">
              البريد المستهدف: <strong className="text-foreground font-mono">{resettingAccount.owner_email}</strong>
            </p>
            <div className="space-y-1.5 max-w-md">
              <label className="font-semibold text-foreground">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="أدخل كلمة مرور جديدة (مثلاً: Abc@123456)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="ps-9 bg-background border-border"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="outline" size="sm" onClick={() => setResettingAccount(null)}>
              إلغاء
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmResetPassword}
              disabled={resettingPass || !newPassword}
              className="bg-amber-500 font-bold text-slate-950 hover:bg-amber-400"
            >
              {resettingPass ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : null}
              تأكيد حفظ كلمة المرور
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
            placeholder="البحث باسم الشركة أو بريد المالك..."
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
            الكل ({accounts.length})
          </Button>
          <Button
            variant={statusFilter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('active')}
            className="text-xs font-semibold"
          >
            النشطة ({accounts.filter((a) => !a.is_suspended).length})
          </Button>
          <Button
            variant={statusFilter === 'suspended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('suspended')}
            className="text-xs font-semibold text-red-400"
          >
            المحظورة ({accounts.filter((a) => a.is_suspended).length})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span className="text-xs font-medium">جاري تحميل الشركات...</span>
          </div>
        ) : filteredAccounts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-xs font-medium">لم يتم العثور على أي شركات تطابق نتائج البحث.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">اسم الشركة</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">مالك الحساب</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">الباقة الحالية</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">المستخدمون</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">الرسائل</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">حالة الحساب</TableHead>
                  <TableHead className="text-start text-xs font-bold text-muted-foreground">تاريخ التسجيل</TableHead>
                  <TableHead className="text-end text-xs font-bold text-muted-foreground">إجراءات التحكم</TableHead>
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
                          🛑 محظور
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                          ✅ نشط
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-start text-xs text-muted-foreground">
                      {new Date(acc.created_at).toLocaleDateString('ar-EG')}
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
                                <span className="text-xs font-bold text-blue-400">الدخول لحساب الشركة</span>
                                <span className="text-[10px] font-normal text-muted-foreground">تقديم الدعم الفني وتسهيل التكوين</span>
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
                                <span className="text-xs font-bold text-amber-400">تغيير كلمة المرور</span>
                                <span className="text-[10px] font-normal text-muted-foreground">تعيين كلمة مرور جديدة للمالك</span>
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
                                <span className="text-xs font-bold text-amber-500">تغيير الباقة والاشتراك</span>
                                <span className="text-[10px] font-normal text-muted-foreground">ترقية أو تعديل خطة الاشتراك</span>
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
                                  {acc.is_suspended ? 'رفع الحظر عن الحساب' : 'حظر الحساب فوراً'}
                                </span>
                                <span className="text-[10px] font-normal text-muted-foreground">
                                  {acc.is_suspended ? 'إعادة تفعيل صلاحيات الدخول' : 'إيقاف وتعطيل وصول العميل'}
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
    </div>
  );
}
