'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Landmark,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit,
  ExternalLink,
  ShieldCheck,
  Building2,
  FileText,
  Search,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

interface OfflineMethod {
  id: string;
  name: string;
  name_ar?: string;
  name_en?: string;
  account_name?: string;
  account_number: string;
  logo_url?: string;
  instructions?: string;
  is_active: boolean;
  display_order: number;
}

interface OfflineSubmission {
  id: string;
  account_id: string;
  accounts?: { name: string };
  plan_id: string;
  plans?: { name: string; slug: string };
  offline_payment_methods?: { name: string; account_number: string; logo_url: string };
  billing_cycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  transaction_ref?: string;
  proof_image_url?: string;
  user_notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export default function AdminOfflinePaymentsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [methods, setMethods] = useState<OfflineMethod[]>([]);
  const [submissions, setSubmissions] = useState<OfflineSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit Method Modal State
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<OfflineMethod | null>(null);
  const [methodName, setMethodName] = useState('');
  const [methodAccountName, setMethodAccountName] = useState('');
  const [methodAccountNumber, setMethodAccountNumber] = useState('');
  const [methodLogoUrl, setMethodLogoUrl] = useState('');
  const [methodInstructions, setMethodInstructions] = useState('');
  const [methodIsActive, setMethodIsActive] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Review Submission Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewSubmission, setReviewSubmission] = useState<OfflineSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [customMsgAr, setCustomMsgAr] = useState('');
  const [customMsgEn, setCustomMsgEn] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  // Image Preview Modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [methodsRes, subsRes] = await Promise.all([
        fetch('/api/admin/offline-methods').then((r) => r.json()),
        fetch('/api/admin/offline-payments').then((r) => r.json()),
      ]);

      setMethods(methodsRes.methods || []);
      setSubmissions(subsRes.submissions || []);
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل بيانات الدفع المحلي' : 'Failed to load offline payment data');
    } finally {
      setLoading(false);
    }
  }

  function openNewMethodModal() {
    setEditingMethod(null);
    setMethodName('');
    setMethodAccountName('');
    setMethodAccountNumber('');
    setMethodLogoUrl('');
    setMethodInstructions('');
    setMethodIsActive(true);
    setMethodModalOpen(true);
  }

  function openEditMethodModal(method: OfflineMethod) {
    setEditingMethod(method);
    setMethodName(method.name || '');
    setMethodAccountName(method.account_name || '');
    setMethodAccountNumber(method.account_number || '');
    setMethodLogoUrl(method.logo_url || '');
    setMethodInstructions(method.instructions || '');
    setMethodIsActive(method.is_active);
    setMethodModalOpen(true);
  }

  async function handleSaveMethod(e: React.FormEvent) {
    e.preventDefault();
    if (!methodName.trim() || !methodAccountNumber.trim()) {
      toast.error(isAr ? 'يرجى كتابة اسم طريقة الدفع ورقم الحساب/المحفظة' : 'Please provide method name and account number');
      return;
    }

    try {
      setSavingMethod(true);
      const payload = {
        id: editingMethod?.id,
        name: methodName,
        name_ar: methodName,
        name_en: methodName,
        account_name: methodAccountName,
        account_number: methodAccountNumber,
        logo_url: methodLogoUrl,
        instructions: methodInstructions,
        is_active: methodIsActive,
      };

      const res = await fetch('/api/admin/offline-methods', {
        method: editingMethod ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success(editingMethod ? (isAr ? 'تم تحديث طريقة الدفع' : 'Method updated') : (isAr ? 'تم إضافة طريقة الدفع الجديدة' : 'Method added'));
      setMethodModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ عند الحفظ' : 'Save failed'));
    } finally {
      setSavingMethod(false);
    }
  }

  async function handleDeleteMethod(id: string) {
    if (!confirm(isAr ? 'هل أنت تأكد من حذف طريقة الدفع هذه؟' : 'Are you sure you want to delete this method?')) return;
    try {
      const res = await fetch(`/api/admin/offline-methods?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success(isAr ? 'تم حذف طريقة الدفع' : 'Method deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting method');
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-receipt', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');

      setMethodLogoUrl(data.url);
      toast.success(isAr ? 'تم رفع اللوغو بنجاح' : 'Logo uploaded');
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'فشل رفع الشعار' : 'Logo upload failed'));
    } finally {
      setUploadingLogo(false);
    }
  }

  function openReviewModal(sub: OfflineSubmission, action: 'approve' | 'reject') {
    setReviewSubmission(sub);
    setReviewAction(action);
    setAdminNotes('');

    const planName = sub.plans?.name || 'الباقة';

    if (action === 'approve') {
      setCustomMsgAr(`تهانينا! تم مراجعة إثبات الدفع والتحقق من الحوالة، وتم تفعيل باقة (${planName}) بنجاح لحسابك. 🚀`);
      setCustomMsgEn(`Congratulations! Your payment proof was verified and (${planName}) plan has been activated for your account. 🚀`);
    } else {
      setCustomMsgAr(`عذراً، تم رفض طلب الدفع المقدم لباقة (${planName}). يرجى التأكد من صورة الوصل أو رقم المرجع وإعادة المحاولة.`);
      setCustomMsgEn(`Regrettably, your payment submission for (${planName}) plan was rejected. Please check receipt screenshot or reference code.`);
    }

    setReviewModalOpen(true);
  }

  async function handleReviewSubmit() {
    if (!reviewSubmission) return;

    try {
      setProcessingReview(true);
      const res = await fetch('/api/admin/offline-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: reviewSubmission.id,
          action: reviewAction,
          admin_notes: adminNotes,
          custom_msg_ar: customMsgAr,
          custom_msg_en: customMsgEn,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');

      toast.success(data.message || (isAr ? 'تم تنفيذ الإجراء بنجاح' : 'Action processed'));
      setReviewModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'حدث خطأ عند تنفيذ الطلب' : 'Failed to process review'));
    } finally {
      setProcessingReview(false);
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const accountName = s.accounts?.name?.toLowerCase() || '';
      const ref = s.transaction_ref?.toLowerCase() || '';
      const planName = s.plans?.name?.toLowerCase() || '';
      return accountName.includes(q) || ref.includes(q) || planName.includes(q);
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'pending').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Landmark className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
                {isAr ? 'إدارة الدفع المحلي والأوفلاين 🏦' : 'Offline Payment Gateway'}
              </h1>
              <p className="text-xs text-muted-foreground font-normal">
                {isAr
                  ? 'إدارة حسابات البنوك والمحافظ المحلية، ومراجعة إثباتات الدفع الواردة لتفعيل الباقات'
                  : 'Manage local bank & wallet details and review incoming payment proofs'}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={openNewMethodModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl h-11 px-5 shadow-lg shadow-emerald-600/20"
        >
          <Plus className="h-4 w-4 me-2" />
          {isAr ? 'إضافة طريقة دفع جديدة' : 'Add Payment Method'}
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="submissions" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-zinc-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-zinc-800 w-full sm:w-auto grid grid-cols-2">
          <TabsTrigger
            value="submissions"
            className="rounded-xl text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
          >
            <Clock className="h-4 w-4 me-2 text-amber-500" />
            {isAr ? `طلبات وإثباتات الدفع (${pendingCount} معلق)` : `Payment Receipts (${pendingCount} pending)`}
          </TabsTrigger>
          <TabsTrigger
            value="methods"
            className="rounded-xl text-xs font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-sm"
          >
            <Building2 className="h-4 w-4 me-2 text-emerald-500" />
            {isAr ? `طرق الدفع المتاحة (${methods.length})` : `Payment Methods (${methods.length})`}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Payment Submissions & Proof Reviews */}
        <TabsContent value="submissions" className="mt-6 space-y-4">
          <Card className="border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-zinc-800/80 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100">
                    {isAr ? 'وصلات وإثباتات الدفع الواردة' : 'Incoming Payment Receipts'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {isAr ? 'استعراض الحوالات البنكية والمحفظية واعتماد تفعيل الباقات' : 'Review bank transfers & activate user subscriptions'}
                  </CardDescription>
                </div>

                {/* Filter & Search Controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={isAr ? 'بحث عن حساب أو مرجع...' : 'Search account or ref...'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="ps-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800"
                    />
                  </div>

                  <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'pending' ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {isAr ? 'معلقة' : 'Pending'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('approved')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'approved' ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {isAr ? 'مقبولة' : 'Approved'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'rejected' ? 'bg-white dark:bg-zinc-900 text-rose-600 shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {isAr ? 'مرفوضة' : 'Rejected'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${statusFilter === 'all' ? 'bg-white dark:bg-zinc-900 text-foreground shadow-sm' : 'text-muted-foreground'}`}
                    >
                      {isAr ? 'الكل' : 'All'}
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center p-12 text-muted-foreground text-xs font-bold">
                  {isAr ? 'لا يوجد أي إثباتات دفع مطابقة للشروط' : 'No matching payment submissions found'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 dark:border-zinc-800">
                        <TableHead className="text-xs font-bold">{isAr ? 'اسم الحساب / العميل' : 'Account / User'}</TableHead>
                        <TableHead className="text-xs font-bold">{isAr ? 'الباقة المطلوبة' : 'Plan'}</TableHead>
                        <TableHead className="text-xs font-bold">{isAr ? 'المبلغ' : 'Amount'}</TableHead>
                        <TableHead className="text-xs font-bold">{isAr ? 'طريقة الدفع والمرجع' : 'Method & Ref'}</TableHead>
                        <TableHead className="text-xs font-bold">{isAr ? 'إثبات الدفع' : 'Proof'}</TableHead>
                        <TableHead className="text-xs font-bold">{isAr ? 'الحالة' : 'Status'}</TableHead>
                        <TableHead className="text-xs font-bold text-end">{isAr ? 'الإجراء' : 'Action'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((sub) => (
                        <TableRow key={sub.id} className="border-b border-slate-100 dark:border-zinc-800/60">
                          <TableCell className="font-bold text-xs">
                            <div>{sub.accounts?.name || 'حساب بدون اسم'}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{new Date(sub.created_at).toLocaleDateString()}</div>
                          </TableCell>
                          <TableCell className="text-xs font-bold">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold">
                              {sub.plans?.name || 'باقة'} ({sub.billing_cycle === 'yearly' ? (isAr ? 'سنوي' : 'Yearly') : (isAr ? 'شهري' : 'Monthly')})
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            ${sub.amount} {sub.currency}
                          </TableCell>
                          <TableCell className="text-xs">
                            <div className="font-bold">{sub.offline_payment_methods?.name || 'دفع محلي'}</div>
                            {sub.transaction_ref && (
                              <div className="text-[11px] font-mono text-muted-foreground dir-ltr">
                                Ref: {sub.transaction_ref}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.proof_image_url ? (
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(sub.proof_image_url || null)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                <ImageIcon className="h-4 w-4" />
                                {isAr ? 'معاينة الوصل 👁️' : 'View Proof'}
                              </button>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">{isAr ? 'بدون صورة' : 'No image'}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sub.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Clock className="h-3.5 w-3.5" />
                                {isAr ? 'قيد المراجعة' : 'Pending'}
                              </span>
                            )}
                            {sub.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {isAr ? 'مقبول ومفعّل' : 'Approved'}
                              </span>
                            )}
                            {sub.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                <XCircle className="h-3.5 w-3.5" />
                                {isAr ? 'مرفوض' : 'Rejected'}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-end">
                            {sub.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => openReviewModal(sub, 'approve')}
                                  className="h-8 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5 me-1" />
                                  {isAr ? 'موافق وتفعيل' : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openReviewModal(sub, 'reject')}
                                  className="h-8 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:hover:bg-rose-950 font-bold text-xs"
                                >
                                  <XCircle className="h-3.5 w-3.5 me-1" />
                                  {isAr ? 'رفض' : 'Reject'}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">
                                {sub.admin_notes ? `ملاحظة: ${sub.admin_notes}` : (isAr ? 'مكتمل' : 'Completed')}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Payment Methods Catalog */}
        <TabsContent value="methods" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {methods.map((method) => (
              <Card
                key={method.id}
                className={`border rounded-3xl transition-all shadow-sm ${method.is_active ? 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900' : 'border-slate-200/60 dark:border-zinc-800/40 bg-slate-50/50 dark:bg-zinc-900/40 opacity-75'}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {method.logo_url ? (
                        <img
                          src={method.logo_url}
                          alt={method.name}
                          className="h-10 w-10 object-contain rounded-xl border border-slate-200 dark:border-zinc-800 bg-white p-1"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                          <Landmark className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                          {method.name}
                        </CardTitle>
                        {method.account_name && (
                          <CardDescription className="text-xs">
                            {isAr ? 'الاسم:' : 'Holder:'} {method.account_name}
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${method.is_active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-200 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                      {method.is_active ? (isAr ? 'مفعل' : 'Active') : (isAr ? 'معطل' : 'Inactive')}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-2xl font-mono text-xs dir-ltr font-bold text-foreground border border-slate-100 dark:border-zinc-800">
                    <span className="text-[10px] text-muted-foreground block font-sans">{isAr ? 'رقم الحساب / المحفظة / IBAN:' : 'Account / IBAN / Wallet:'}</span>
                    {method.account_number}
                  </div>

                  {method.instructions && (
                    <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                      {method.instructions}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditMethodModal(method)}
                      className="h-8 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl"
                    >
                      <Edit className="h-3.5 w-3.5 me-1" />
                      {isAr ? 'تعديل' : 'Edit'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMethod(method.id)}
                      className="h-8 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
                    >
                      <Trash2 className="h-3.5 w-3.5 me-1" />
                      {isAr ? 'حذف' : 'Delete'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add / Edit Method Dialog Modal */}
      <Dialog open={methodModalOpen} onOpenChange={setMethodModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {editingMethod ? (isAr ? 'تعديل طريقة الدفع' : 'Edit Payment Method') : (isAr ? 'إضافة طريقة دفع جديدة' : 'Add New Payment Method')}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveMethod} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold">{isAr ? 'اسم طريقة الدفع / البنك / المحفظة *' : 'Method / Bank Name *'}</Label>
              <Input
                placeholder={isAr ? 'مثال: بنك الراجحي / زين كاش / STC Pay' : 'e.g. Bank Al-Rajhi / ZainCash'}
                value={methodName}
                onChange={(e) => setMethodName(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{isAr ? 'اسم المستفيد / المستلم' : 'Account Holder Name'}</Label>
              <Input
                placeholder={isAr ? 'اسم المستلم الثلاثي أو اسم الشركة' : 'Holder Name / Company'}
                value={methodAccountName}
                onChange={(e) => setMethodAccountName(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{isAr ? 'رقم الحساب / IBAN / رقم المحفظة *' : 'Account # / IBAN / Wallet *'}</Label>
              <Input
                placeholder="SA00 0000 0000 0000 0000 0000"
                value={methodAccountNumber}
                onChange={(e) => setMethodAccountNumber(e.target.value)}
                required
                className="h-10 text-xs rounded-xl dir-ltr font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{isAr ? 'لوغو / شعار البنك (اختياري)' : 'Logo Image URL'}</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://... logo.png"
                  value={methodLogoUrl}
                  onChange={(e) => setMethodLogoUrl(e.target.value)}
                  className="h-10 text-xs rounded-xl flex-1 dir-ltr"
                />
                <label className="cursor-pointer">
                  <span className="h-10 px-3 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl flex items-center justify-center text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-200 transition-colors">
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold">{isAr ? 'تعليمات وإرشادات الدفع للمستخدم' : 'Payment Instructions'}</Label>
              <Textarea
                placeholder={isAr ? 'اكتب أي ملاحظات مثل: يرجى كتابة اسمك في ملاحظة الحوالة ورسم الصورة...' : 'Enter payment details or notes...'}
                value={methodInstructions}
                onChange={(e) => setMethodInstructions(e.target.value)}
                className="text-xs rounded-xl min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Label className="text-xs font-bold">{isAr ? 'حالة طريقة الدفع (مفعلة للمستخدمين)' : 'Enable for Users'}</Label>
              <Switch checked={methodIsActive} onCheckedChange={setMethodIsActive} />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="submit"
                disabled={savingMethod}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl"
              >
                {savingMethod ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'حفظ البيانات' : 'Save Method')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Review Submission Modal (Approve / Reject) */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              {reviewAction === 'approve' ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-5 w-5" />
                  {isAr ? 'تأكيد الموافقة وتفعيل الباقة 🚀' : 'Approve & Activate Plan'}
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <XCircle className="h-5 w-5" />
                  {isAr ? 'رفض طلب الدفع' : 'Reject Payment Request'}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {reviewSubmission && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-900 rounded-2xl space-y-1.5 border border-slate-100 dark:border-zinc-800">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? 'العميل/الحساب:' : 'Account:'}</span>
                  <span className="font-bold">{reviewSubmission.accounts?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{isAr ? 'الباقة المطلوبة:' : 'Target Plan:'}</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{reviewSubmission.plans?.name} (${reviewSubmission.amount})</span>
                </div>
                {reviewSubmission.transaction_ref && (
                  <div className="flex justify-between dir-ltr">
                    <span className="text-muted-foreground font-sans">Ref Code:</span>
                    <span className="font-mono font-bold">{reviewSubmission.transaction_ref}</span>
                  </div>
                )}
              </div>

              {reviewAction === 'approve' ? (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {isAr
                    ? 'عند النقر على موافقة، سيتم تفعيل باقة الاشتراك المحددة فورياً لهذا الحساب وتحديث تاريخ الصلاحية.'
                    : 'Approving will immediately activate the subscription plan for this account.'}
                </p>
              ) : (
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {isAr
                    ? 'عند النقر على رفض، سيبقى الحساب في باقته الحالية ويصل تنبيه للمستخدم بالسبب.'
                    : 'Rejecting will keep the user on their current plan.'}
                </p>
              )}

              <div className="space-y-3 pt-1">
                {/* Preset Templates Selector */}
                <div className="space-y-1.5 p-3 bg-slate-50 dark:bg-zinc-900/90 rounded-2xl border border-slate-200 dark:border-zinc-800">
                  <Label className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>{isAr ? 'رسائل جاهزة بنقرة واحدة (Presets):' : 'Ready-made Template Presets:'}</span>
                    <span className="text-[10px] text-muted-foreground font-normal">{isAr ? 'يمكنك اختيار نموذج وتعديله بحرية' : 'Click to load & edit'}</span>
                  </Label>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {reviewAction === 'approve' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const planName = reviewSubmission?.plans?.name || 'الباقة';
                            setCustomMsgAr(`تهانينا! تم مراجعة إثبات الدفع والتحقق من الحوالة، وتم تفعيل باقة (${planName}) بنجاح لحسابك. 🚀`);
                            setCustomMsgEn(`Congratulations! Your payment proof was verified and (${planName}) plan has been activated for your account. 🚀`);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                        >
                          🟢 تفعيل قياسي
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const planName = reviewSubmission?.plans?.name || 'الباقة';
                            setCustomMsgAr(`شكراً لثقتك بنا! تم اعتماد الدفع وتفعيل باقة (${planName}) بنجاح. نتمنى لك تجربة ممتازة ⚡`);
                            setCustomMsgEn(`Thank you for your trust! Payment approved and (${planName}) plan activated successfully. Have a great experience ⚡`);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[11px] font-bold border border-teal-500/30 hover:bg-teal-500/25 transition-colors cursor-pointer"
                        >
                          ⚡ تفعيل مع الشكر
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMsgAr(`عذراً، تم رفض طلب الدفع لأن صورة وصل الدفع المرفقة غير واضحة. يرجى إرفاق صورة واضحة للحوالة وإعادة المحاولة.`);
                            setCustomMsgEn(`Regrettably, your payment proof was rejected because the receipt image is unclear. Please attach a clear screenshot and re-submit.`);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[11px] font-bold border border-rose-500/30 hover:bg-rose-500/25 transition-colors cursor-pointer"
                        >
                          🔴 صورة غير واضحة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMsgAr(`عذراً، رقم الحوالة/المرجع المدخل غير مطابق للسجلات البنكية. يرجى التأكد من الرقم وإعادة إرسال الطلب.`);
                            setCustomMsgEn(`The transaction reference code provided does not match bank records. Please verify the reference code and re-submit.`);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
                        >
                          🟡 رقم مرجع خاطئ
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomMsgAr(`عذراً، المبلغ المحول في الوصل أقل من قيمة الاشتراك المطلوبة. يرجى استكمال المبلغ المتبقي أو التواصل معنا.`);
                            setCustomMsgEn(`The transferred amount is less than the required plan fee. Please transfer the remaining balance or contact support.`);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors cursor-pointer"
                        >
                          🔵 المبلغ غير مكتمل
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    🇸🇦 {isAr ? 'رسالة الإشعار للمستخدم (بالعربية) - تظهر في تذاكر الدعم والبرودكاست:' : 'Arabic User Notification Message:'}
                  </Label>
                  <Textarea
                    value={customMsgAr}
                    onChange={(e) => setCustomMsgAr(e.target.value)}
                    className="text-xs rounded-xl min-h-[65px]"
                    placeholder={isAr ? 'اكتب أو عدل رسالة الإشعار بالعربية...' : 'Arabic message...'}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    🇬🇧 {isAr ? 'رسالة الإشعار للمستخدم (بالإنجليزي):' : 'English User Notification Message:'}
                  </Label>
                  <Textarea
                    value={customMsgEn}
                    onChange={(e) => setCustomMsgEn(e.target.value)}
                    className="text-xs rounded-xl min-h-[60px]"
                    placeholder={isAr ? 'اكتب رسالة الإشعار بالإنجليزي...' : 'English message...'}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">{isAr ? 'ملاحظات إضافية داخلية للإدارة (اختياري):' : 'Internal Admin Notes (Optional):'}</Label>
                  <Input
                    placeholder={reviewAction === 'approve' ? (isAr ? 'مثال: تم التأكد من وصول الحوالة' : 'e.g. Bank statement checked') : (isAr ? 'مثال: الصورة غير واضحة' : 'e.g. Unclear screenshot')}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  onClick={handleReviewSubmit}
                  disabled={processingReview}
                  className={`w-full h-11 text-white font-bold rounded-2xl ${reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20'}`}
                >
                  {processingReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : reviewAction === 'approve' ? (
                    isAr ? 'تأكيد تفعيل الباقة الآن 🚀' : 'Confirm & Activate Plan'
                  ) : (
                    isAr ? 'تأكيد رفض الطلب' : 'Confirm Rejection'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Receipt Preview Modal */}
      {previewImageUrl && (
        <Dialog open={Boolean(previewImageUrl)} onOpenChange={() => setPreviewImageUrl(null)}>
          <DialogContent className="sm:max-w-xl rounded-3xl bg-white dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 p-4">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold">{isAr ? 'معاينة صورة وصل / إثبات الدفع 🖼️' : 'Payment Proof Receipt'}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-2 bg-slate-900 rounded-2xl overflow-hidden">
              <img
                src={previewImageUrl}
                alt="Payment Receipt"
                className="max-h-[80vh] w-auto object-contain rounded-xl"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewImageUrl(null)} className="w-full rounded-2xl">
                {isAr ? 'إغلاق المعاينة' : 'Close Preview'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
