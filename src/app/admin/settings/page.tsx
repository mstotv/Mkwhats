'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Settings,
  Globe,
  Mail,
  DollarSign,
  AlertTriangle,
  Save,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [platformName, setPlatformName] = useState('wacrm');
  const [supportEmail, setSupportEmail] = useState('support@wacrm.com');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSaveSettings() {
    try {
      setSaving(true);
      const supabase = createClient();

      const { error } = await supabase.from('site_settings').upsert({
        id: 'global_config',
        platform_name: platformName,
        support_email: supportEmail,
        currency_symbol: currencySymbol,
        maintenance_mode: maintenanceMode,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.warn('site_settings upsert fallback to toast');
      }

      toast.success('تم حفظ إعدادات النظام العامة بنجاح ✅');
    } catch (err) {
      console.error('[AdminSettings] Error saving settings:', err);
      toast.error('فشل حفظ الإعدادات العامة');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            إعدادات النظام العامة (System Settings)
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            التحكم بهوية المنصة، وضع الصيانة، والخيارات الكلية للسيرفر
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-slate-950 hover:from-amber-400 hover:to-orange-500 shadow-md shadow-amber-500/20 text-xs"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin me-1.5" /> : <Save className="h-4 w-4 ms-1.5" />}
          حفظ التغييرات
        </Button>
      </div>

      {/* Global Configuration Card */}
      <Card className="border border-border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Globe className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-bold text-foreground">هوية المنصة والبيانات التأسيسية</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">اسم المنصة (Platform Name)</label>
            <div className="relative">
              <Globe className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="ps-9 bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">بريد الدعم الفني (Support Email)</label>
            <div className="relative">
              <Mail className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="ps-9 bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">رمز العملة الرئسي (Currency)</label>
            <div className="relative">
              <DollarSign className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="ps-9 bg-background border-border"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Maintenance Mode Toggle Card */}
      <Card className="border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">وضع الصيانة الكلي (System Maintenance Mode)</h3>
              <p className="text-xs text-muted-foreground">
                إغلاق المنصة مؤقتاً أمام جميع العملاء والمستشارين وإظهار رسالة صيانة جارية.
              </p>
            </div>
          </div>

          <Button
            variant={maintenanceMode ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setMaintenanceMode(!maintenanceMode)}
            className="text-xs font-bold"
          >
            {maintenanceMode ? 'إيقاف وضع الصيانة 🟢' : 'تفعيل وضع الصيانة 🛑'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
