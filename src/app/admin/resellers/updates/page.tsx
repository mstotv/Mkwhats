'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';
import {
  Sparkles,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Megaphone,
  Wrench,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ResellerTabs } from '../_components/reseller-tabs';

interface ResellerUpdate {
  id: string;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  category: 'feature' | 'update' | 'announcement' | 'maintenance';
  badge?: string;
  is_published: boolean;
  created_at: string;
}

export default function ResellerUpdatesPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [updates, setUpdates] = useState<ResellerUpdate[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    title_ar: '',
    content: '',
    content_ar: '',
    category: 'feature' as 'feature' | 'update' | 'announcement' | 'maintenance',
    badge: 'New',
  });

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resellers/updates');
      const data = await res.json();
      if (res.ok) {
        setUpdates(data.updates || []);
      } else {
        toast.error(data.error || 'Failed to load updates');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error(isAr ? 'العنوان والمحتوى مطلوبان' : 'Title and content required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/resellers/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isAr ? 'تم نشر التحديث للموزعين بنجاح' : 'Update published successfully');
        setIsModalOpen(false);
        setFormData({
          title: '',
          title_ar: '',
          content: '',
          content_ar: '',
          category: 'feature',
          badge: 'New',
        });
        fetchUpdates();
      } else {
        toast.error(data.error || 'Failed to publish update');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا التحديث؟' : 'Delete this update?')) return;
    try {
      const res = await fetch(`/api/admin/resellers/updates?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success(isAr ? 'تم الحذف' : 'Deleted');
        fetchUpdates();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'feature':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {isAr ? 'ميزة جديدة' : 'New Feature'}
          </Badge>
        );
      case 'announcement':
        return (
          <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 text-[10px] flex items-center gap-1">
            <Megaphone className="h-3 w-3" />
            {isAr ? 'إعلان هام' : 'Announcement'}
          </Badge>
        );
      case 'maintenance':
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            {isAr ? 'صيانة نظام' : 'Maintenance'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {isAr ? 'تحديث' : 'Update'}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-emerald-500" />
            <span>{isAr ? 'مركز تحديثات ومميزات الريسيلر' : 'Reseller Updates & Changelog'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isAr
              ? 'انشر التحديثات البرمجية، الميزات المضافة، والإعلانات الحصرية التي تظهر لموزعي الخدمة في لوحاتهم.'
              : 'Broadcast release notes, upcoming capabilities, and operational announcements to partners.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={fetchUpdates}
            variant="outline"
            size="sm"
            className="rounded-xl border-border h-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 ms-1.5" />
            {isAr ? 'نشر تحديث جديد' : 'Broadcast Update'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <ResellerTabs />

      {/* 2. Updates Feed List */}
      <div className="space-y-4">
        {loading ? (
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500 ms-2" />
            <span className="text-xs">{isAr ? 'جاري التحميل...' : 'Loading updates...'}</span>
          </div>
        ) : updates.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-card">
            <Sparkles className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-semibold">{isAr ? 'لم يتم نشر أي تحديثات للريسيلر بعد' : 'No broadcasts yet'}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isAr ? 'شارك الموزعين بآخر التطورات التقنية والميزات الجديدة' : 'Keep partners notified of new releases and platform upgrades'}
            </p>
          </div>
        ) : (
          updates.map((up) => (
            <div
              key={up.id}
              className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-emerald-500/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(up.category)}
                    {up.badge && (
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {up.badge}
                      </Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(up.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground pt-1">
                    {isAr ? (up.title_ar || up.title) : up.title}
                  </h3>
                </div>

                <Button
                  onClick={() => handleDelete(up.id)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-500/10 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-3 text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed border-t border-border/50 pt-3">
                {isAr ? (up.content_ar || up.content) : up.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. Broadcast Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span>{isAr ? 'نشر تحديث أو ميزة جديدة للموزعين' : 'Broadcast Reseller Update'}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isAr
                ? 'سيظهر هذا الإشعار والتحديث في لوحات تحكم جميع الموزعين النشطين.'
                : 'This announcement will be displayed inside all active reseller partner dashboards.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'العنوان (English) *' : 'Title (EN) *'}</Label>
                <Input
                  required
                  placeholder="New AI Auto-Reply Features"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'العنوان (العربية)' : 'Title (AR)'}</Label>
                <Input
                  placeholder="إطلاق ميزات الذكاء الاصطناعي الجديدة"
                  value={formData.title_ar}
                  onChange={(e) => setFormData({ ...formData, title_ar: e.target.value })}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'التصنيف' : 'Category'}</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 text-xs font-semibold focus:outline-hidden"
                >
                  <option value="feature">{isAr ? 'ميزة جديدة (Feature)' : 'Feature'}</option>
                  <option value="update">{isAr ? 'تحديث تقني (Update)' : 'Update'}</option>
                  <option value="announcement">{isAr ? 'إعلان هام (Announcement)' : 'Announcement'}</option>
                  <option value="maintenance">{isAr ? 'صيانة دورية (Maintenance)' : 'Maintenance'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">{isAr ? 'الشارة (Badge)' : 'Badge Label'}</Label>
                <Input
                  placeholder="v2.5 / New"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="rounded-xl h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'تفاصيل التحديث (English) *' : 'Content (EN) *'}</Label>
              <textarea
                required
                rows={3}
                placeholder="Details about the new feature or upgrade..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">{isAr ? 'تفاصيل التحديث (العربية)' : 'Content (AR)'}</Label>
              <textarea
                rows={3}
                placeholder="تفاصيل التحديث أو الميزة الجديدة بالعربية..."
                value={formData.content_ar}
                onChange={(e) => setFormData({ ...formData, content_ar: e.target.value })}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs focus:outline-hidden"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl text-xs h-9"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 shadow-sm"
              >
                {submitting ? <RefreshCw className="h-4 w-4 animate-spin ms-1" /> : null}
                {isAr ? 'نشر الآن' : 'Publish Broadcast'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
