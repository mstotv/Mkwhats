'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  ShoppingBag,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  KeyRound,
  Globe,
  Lock,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
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
} from '@/components/ui/dialog';
import { SettingsPanelHead } from './settings-panel-head';
import type { EcommerceStoreSafe } from '@/lib/ecommerce/types';

export function IntegrationsPanel() {
  const t = useTranslations('Settings');
  const [stores, setStores] = useState<EcommerceStoreSafe[]>([]);
  const [loading, setLoading] = useState(true);

  // Guide Dialog state
  const [guideProvider, setGuideProvider] = useState<'woocommerce' | 'shopify' | null>(null);

  // WooCommerce form state
  const [wcUrl, setWcUrl] = useState('');
  const [wcKey, setWcKey] = useState('');
  const [wcSecret, setWcSecret] = useState('');
  const [wcWebhookSecret, setWcWebhookSecret] = useState('');
  const [wcSubmitting, setWcSubmitting] = useState(false);
  const [wcTesting, setWcTesting] = useState(false);

  // Shopify form state
  const [shopifyUrl, setShopifyUrl] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [shopifyWebhookSecret, setShopifyWebhookSecret] = useState('');
  const [shopifySubmitting, setShopifySubmitting] = useState(false);
  const [shopifyTesting, setShopifyTesting] = useState(false);

  // Copy state
  const [copiedWcWebhook, setCopiedWcWebhook] = useState(false);
  const [copiedShopifyWebhook, setCopiedShopifyWebhook] = useState(false);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ecommerce/stores');
      if (res.ok) {
        const data = await res.json();
        setStores(data.stores || []);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const woocommerceStore = stores.find((s) => s.provider === 'woocommerce');
  const shopifyStore = stores.find((s) => s.provider === 'shopify');

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const wcWebhookUrl = woocommerceStore ? `${origin}/api/webhooks/woocommerce?store_id=${woocommerceStore.id}` : '';
  const shopifyWebhookUrl = shopifyStore ? `${origin}/api/webhooks/shopify?store_id=${shopifyStore.id}` : '';

  // WooCommerce connect handler
  const handleConnectWooCommerce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wcUrl.trim() || !wcKey.trim() || !wcSecret.trim()) {
      toast.error('Please enter Store URL, Consumer Key, and Consumer Secret');
      return;
    }

    try {
      setWcSubmitting(true);
      const res = await fetch('/api/ecommerce/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'woocommerce',
          storeUrl: wcUrl.trim(),
          wcConsumerKey: wcKey.trim(),
          wcConsumerSecret: wcSecret.trim(),
          webhookSecret: wcWebhookSecret.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to connect WooCommerce store');
        return;
      }

      toast.success('WooCommerce store connected successfully!');
      setWcKey('');
      setWcSecret('');
      setWcWebhookSecret('');
      fetchStores();
    } catch (err) {
      toast.error('Failed to connect store');
    } finally {
      setWcSubmitting(false);
    }
  };

  // Shopify connect handler
  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopifyUrl.trim() || !shopifyToken.trim()) {
      toast.error('Please enter Store URL and Admin Access Token');
      return;
    }

    try {
      setShopifySubmitting(true);
      const res = await fetch('/api/ecommerce/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'shopify',
          storeUrl: shopifyUrl.trim(),
          shopifyAccessToken: shopifyToken.trim(),
          webhookSecret: shopifyWebhookSecret.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to connect Shopify store');
        return;
      }

      toast.success('Shopify store connected successfully!');
      setShopifyToken('');
      setShopifyWebhookSecret('');
      fetchStores();
    } catch (err) {
      toast.error('Failed to connect store');
    } finally {
      setShopifySubmitting(false);
    }
  };

  // Test connection
  const handleTestConnection = async (storeId: string, provider: 'woocommerce' | 'shopify') => {
    const setTesting = provider === 'woocommerce' ? setWcTesting : setShopifyTesting;
    try {
      setTesting(true);
      const res = await fetch(`/api/ecommerce/stores/${storeId}/test`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Connection test failed');
        return;
      }
      toast.success(`Connection verified successfully!`);
    } catch (err) {
      toast.error('Connection test request failed');
    } finally {
      setTesting(false);
    }
  };

  // Disconnect store
  const handleDisconnect = async (storeId: string, providerName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${providerName}?`)) return;

    try {
      const res = await fetch(`/api/ecommerce/stores/${storeId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        toast.error('Failed to disconnect store');
        return;
      }
      toast.success(`${providerName} disconnected`);
      fetchStores();
    } catch (err) {
      toast.error('Failed to disconnect store');
    }
  };

  const copyToClipboard = (text: string, type: 'wc' | 'shopify') => {
    navigator.clipboard.writeText(text);
    if (type === 'wc') {
      setCopiedWcWebhook(true);
      setTimeout(() => setCopiedWcWebhook(false), 2000);
    } else {
      setCopiedShopifyWebhook(true);
      setTimeout(() => setCopiedShopifyWebhook(false), 2000);
    }
    toast.success('Webhook URL copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsPanelHead
        title="E-Commerce Integrations"
        description="Connect your WooCommerce or Shopify online stores to trigger WhatsApp automations on orders and customer actions."
      />

      <div className="grid gap-6">
        {/* WooCommerce Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">WooCommerce</h3>
                  {woocommerceStore?.status === 'connected' ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Disconnected
                    </Badge>
                  )}
                  {/* Setup Guide Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setGuideProvider('woocommerce')}
                    className="h-7 gap-1.5 px-2 text-xs font-medium text-purple-600 hover:bg-purple-500/10 dark:text-purple-400"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    دليل الربط (Setup Guide)
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your WordPress / WooCommerce store via REST API keys.
                </p>
              </div>
            </div>
          </div>

          {woocommerceStore ? (
            <div className="mt-6 space-y-4 rounded-lg border border-border/60 bg-muted/40 p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Store URL: </span>
                  <a
                    href={woocommerceStore.store_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    {woocommerceStore.store_url} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Connected: </span>
                  <span className="font-medium text-foreground">
                    {woocommerceStore.connected_at
                      ? new Date(woocommerceStore.connected_at).toLocaleDateString()
                      : 'Yes'}
                  </span>
                </div>
              </div>

              {/* Webhook delivery URL */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Webhook Delivery URL (Add in WooCommerce → Settings → Advanced → Webhooks):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={wcWebhookUrl}
                    className="bg-background font-mono text-xs text-foreground"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(wcWebhookUrl, 'wc')}
                  >
                    {copiedWcWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={wcTesting}
                  onClick={() => handleTestConnection(woocommerceStore.id, 'woocommerce')}
                >
                  {wcTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDisconnect(woocommerceStore.id, 'WooCommerce')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectWooCommerce} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Store URL <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="https://mystore.com"
                      value={wcUrl}
                      onChange={(e) => setWcUrl(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Consumer Key <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ck_xxxxxxxxxxxxxxxx"
                      value={wcKey}
                      onChange={(e) => setWcKey(e.target.value)}
                      className="pl-9"
                      type="password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Consumer Secret <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="cs_xxxxxxxxxxxxxxxx"
                      value={wcSecret}
                      onChange={(e) => setWcSecret(e.target.value)}
                      className="pl-9"
                      type="password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Webhook Secret <span className="text-muted-foreground">(Optional, for HMAC signature verification)</span>
                  </label>
                  <Input
                    placeholder="Enter secret configured in WooCommerce Webhooks"
                    value={wcWebhookSecret}
                    onChange={(e) => setWcWebhookSecret(e.target.value)}
                    type="password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={wcSubmitting}>
                  {wcSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect WooCommerce
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Shopify Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">Shopify</h3>
                  {shopifyStore?.status === 'connected' ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Disconnected
                    </Badge>
                  )}
                  {/* Setup Guide Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setGuideProvider('shopify')}
                    className="h-7 gap-1.5 px-2 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    دليل الربط (Setup Guide)
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your Shopify store using a Custom App Admin API Access Token.
                </p>
              </div>
            </div>
          </div>

          {shopifyStore ? (
            <div className="mt-6 space-y-4 rounded-lg border border-border/60 bg-muted/40 p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Store URL: </span>
                  <a
                    href={shopifyStore.store_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-foreground hover:underline inline-flex items-center gap-1"
                  >
                    {shopifyStore.store_url} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">Connected: </span>
                  <span className="font-medium text-foreground">
                    {shopifyStore.connected_at
                      ? new Date(shopifyStore.connected_at).toLocaleDateString()
                      : 'Yes'}
                  </span>
                </div>
              </div>

              {/* Webhook delivery URL */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Webhook Delivery URL (Add in Shopify Admin → Settings → Notifications → Webhooks):
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shopifyWebhookUrl}
                    className="bg-background font-mono text-xs text-foreground"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(shopifyWebhookUrl, 'shopify')}
                  >
                    {copiedShopifyWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={shopifyTesting}
                  onClick={() => handleTestConnection(shopifyStore.id, 'shopify')}
                >
                  {shopifyTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Test Connection
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDisconnect(shopifyStore.id, 'Shopify')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConnectShopify} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Store URL (e.g. yourstore.myshopify.com) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="mystore.myshopify.com"
                      value={shopifyUrl}
                      onChange={(e) => setShopifyUrl(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Admin API Access Token <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={shopifyToken}
                      onChange={(e) => setShopifyToken(e.target.value)}
                      className="pl-9"
                      type="password"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generated under Shopify Admin → Settings → Apps and sales channels → Develop apps.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-medium text-foreground">
                    Webhook Secret / API Secret Key <span className="text-muted-foreground">(Optional, for signature verification)</span>
                  </label>
                  <Input
                    placeholder="Enter Shopify Webhook Signature Secret"
                    value={shopifyWebhookSecret}
                    onChange={(e) => setShopifyWebhookSecret(e.target.value)}
                    type="password"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={shopifySubmitting}>
                  {shopifySubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect Shopify
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Guide Dialog */}
      <Dialog open={guideProvider !== null} onOpenChange={(open) => !open && setGuideProvider(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto max-w-2xl text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <BookOpen className="h-5 w-5 text-primary" />
              {guideProvider === 'woocommerce'
                ? 'دليل ربط ووكومرس (WooCommerce Integration Guide)'
                : 'دليل ربط شوبيفاي (Shopify Integration Guide)'}
            </DialogTitle>
            <DialogDescription>
              {guideProvider === 'woocommerce'
                ? 'خطوات استخراج المفاتيح وإعداد الـ Webhooks في متجرك الإلكتروني على ووردبريس.'
                : 'خطوات إنشاء Custom App في شوبيفاي واستخراج Access Token وإعداد الـ Webhooks.'}
            </DialogDescription>
          </DialogHeader>

          {guideProvider === 'woocommerce' ? (
            <div className="space-y-6 pt-2 text-sm">
              {/* Step 1 */}
              <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs">1</span>
                  استخراج مفاتيح REST API
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                  <li>افتح لوحة تحكم <strong>WordPress</strong> في متجرك.</li>
                  <li>اذهب إلى القائمة الجانبية: <strong>WooCommerce</strong> ← <strong>الإعدادات (Settings)</strong>.</li>
                  <li>انتقل إلى تبويب <strong>متقدم (Advanced)</strong> ثم اضغط على <strong>REST API</strong>.</li>
                  <li>اضغط على زر <strong>إضافة مفتاح (Add key)</strong>.</li>
                  <li>اكتب في الوصف: <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">WhatsApp Automation</code>.</li>
                  <li>في خانة <strong>الصلاحيات (Permissions)</strong> اختر: <strong>قراءة/كتابة (Read/Write)</strong>.</li>
                  <li>اضغط <strong>توليد مفتاح API (Generate API key)</strong>.</li>
                  <li>انسخ كلاً من <strong>Consumer Key</strong> (يبدأ بـ ck_...) و <strong>Consumer Secret</strong> (يبدأ بـ cs_...) والصقهما في المنصة هنا.</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-purple-600 dark:text-purple-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-xs">2</span>
                  إعداد الـ Webhooks لتلقي الطلبات فوراً
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                  <li>بعد ربط المتجر، انسخ رابط <strong>Webhook Delivery URL</strong> الظاهر في بطاقة ووكومرس.</li>
                  <li>في متجرك: اذهب إلى <strong>WooCommerce</strong> ← <strong>الإعدادات</strong> ← <strong>متقدم</strong> ← <strong>Webhooks</strong>.</li>
                  <li>اضغط <strong>إضافة Webhook (Add webhook)</strong>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-foreground">
                      <li><strong>الاسم (Name):</strong> WhatsApp Order Created</li>
                      <li><strong>الحالة (Status):</strong> مفعّل (Active)</li>
                      <li><strong>الموضوع (Topic):</strong> Order created (تم إنشاء الطلب)</li>
                      <li><strong>عنوان URL للتسليم (Delivery URL):</strong> الصق رابط المنصة</li>
                    </ul>
                  </li>
                  <li>اضغط <strong>حفظ Webhook (Save Webhook)</strong>.</li>
                  <li>(اختياري): يمكنك إضافة Webhook آخر لـ <strong>Order updated</strong> لمتابعة تغيرات حالة الطلب.</li>
                </ol>
              </div>

              {/* Step 3 */}
              <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">3</span>
                  إنشاء أتمتة رسائل الواتساب
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  اذهب إلى قسم <strong>Automations</strong> في المنصة، وأنشئ أتمتة بمشغل <strong>Order Created</strong> واكتب رسالة تأكيد الطلب مع المتغيرات مثل: <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">{'{{ customer.name }}'}</code> و <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">{'{{ order.number }}'}</code> و <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">{'{{ order.total }}'}</code>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-2 text-sm">
              {/* Shopify Step 1 */}
              <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">1</span>
                  إنشاء Custom App واستخراج Access Token
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                  <li>افتح <strong>Shopify Admin</strong> لمتجرك.</li>
                  <li>اذهب إلى: <strong>Settings (الإعدادات)</strong> ← <strong>Apps and sales channels</strong>.</li>
                  <li>اضغط على <strong>Develop apps (تطوير التطبيقات)</strong> ← ثم <strong>Create an app</strong>.</li>
                  <li>اكتب اسم التطبيق: <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">WhatsApp Automation</code>.</li>
                  <li>في تبويب <strong>Configuration</strong> ← اضغط Configure بجانب <strong>Admin API integration</strong>.</li>
                  <li>فعّل الصلاحيات التالية (Scopes):
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-foreground font-mono text-[11px]">
                      <li>read_orders / write_orders</li>
                      <li>read_customers</li>
                      <li>read_products</li>
                    </ul>
                  </li>
                  <li>اضغط <strong>Save</strong> ثم اضغط <strong>Install app</strong> في الأعلى.</li>
                  <li>انسخ <strong>Admin API access token</strong> (يبدأ بـ shpat_...) والصقه هنا في المنصة مع رابط متجرك.</li>
                </ol>
              </div>

              {/* Shopify Step 2 */}
              <div className="rounded-lg border border-border/80 bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs">2</span>
                  إعداد الـ Webhooks في Shopify
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-xs leading-relaxed">
                  <li>انسخ <strong>Webhook Delivery URL</strong> الظاهر في بطاقة Shopify بعد الاتصال.</li>
                  <li>في شوبيفاي: اذهب إلى <strong>Settings</strong> ← <strong>Notifications</strong>.</li>
                  <li>انزل إلى أسفل الصفحة حتى قسم <strong>Webhooks</strong> واضغط <strong>Create webhook</strong>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-foreground">
                      <li><strong>Event:</strong> Order creation (أو Order payment)</li>
                      <li><strong>Format:</strong> JSON</li>
                      <li><strong>URL:</strong> الصق الرابط المنسوخ من منصتك</li>
                      <li><strong>Webhook API version:</strong> Latest</li>
                    </ul>
                  </li>
                  <li>اضغط <strong>Save</strong>.</li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={() => setGuideProvider(null)}>
              فهمت ذلك (Got it)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
