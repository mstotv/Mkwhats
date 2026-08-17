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
  Filter,
  MoreVertical,
  ShieldBan,
  ShieldCheck,
  Users,
  MessageSquare,
  Loader2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminAccountRow {
  account_id: string;
  account_name: string;
  created_at: string;
  is_suspended: boolean;
  plan_name: string;
  plan_slug: string;
  subscription_status: string;
  user_count: number;
  message_count: number;
  owner_email: string;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function fetchAccounts() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase.rpc('get_admin_accounts_list');

      if (error) throw error;
      setAccounts((data as AdminAccountRow[]) ?? []);
    } catch (err) {
      console.error('[AdminAccounts] Error fetching accounts:', err);
      toast.error('تعذر تحميل قائمة الشركات');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAccounts();
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
            إدارة الشركات والحسابات (Tenants)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            عرض الشركات المسجلة على المنصة، حظر أو تفعيل الحسابات، ومراقبة حجم الاستهلاك
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAccounts}
          disabled={loading}
          className="border-border text-xs font-semibold"
        >
          <RefreshCw className={`h-3.5 w-3.5 ms-1.5 ${loading ? 'animate-spin' : ''}`} />
          تحديث القائمة
        </Button>
      </div>

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
                  <TableHead className="text-end text-xs font-bold text-muted-foreground">إجراءات</TableHead>
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
                        <DropdownMenuContent align="end" className="border-border bg-popover">
                          <DropdownMenuItem
                            onClick={() => handleToggleSuspension(acc.account_id, acc.is_suspended)}
                            disabled={processingId === acc.account_id}
                            className={acc.is_suspended ? 'text-emerald-400' : 'text-red-400'}
                          >
                            {acc.is_suspended ? (
                              <>
                                <ShieldCheck className="h-4 w-4 me-2" />
                                فك الحظر وإعادة التفعيل
                              </>
                            ) : (
                              <>
                                <ShieldBan className="h-4 w-4 me-2" />
                                حظر الحساب فوراً
                              </>
                            )}
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
