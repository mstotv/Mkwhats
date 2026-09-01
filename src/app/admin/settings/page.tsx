'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Globe,
  Mail,
  DollarSign,
  AlertTriangle,
  Save,
  Loader2,
  RefreshCw,
  CreditCard,
  Building2,
  Plus,
  Trash2,
  MessageSquare,
  Send,
  Palette,
  ShieldCheck,
  Coins,
  Pencil,
  Check,
  X,
  Eye,
  EyeOff,
  ImageIcon,
  Info,
  Sparkles,
  Layers,
  HelpCircle,
  Star,
  Zap,
  Sliders,
  Layout,
  FileText,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  name: string;
  logo_url: string;
}

export interface FAQItem {
  id?: string;
  question: string;
  question_ar?: string;
  question_en?: string;
  answer: string;
  answer_ar?: string;
  answer_en?: string;
}

export interface TestimonialItem {
  id?: string;
  name: string;
  role: string;
  quote: string;
  stars: number;
  avatar_initial: string;
}

export interface FeatureItem {
  id: string;
  title: string;
  title_ar?: string;
  title_en?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
}

export interface StepItem {
  step_number: string;
  title: string;
  title_ar?: string;
  title_en?: string;
  description: string;
  description_ar?: string;
  description_en?: string;
}

type SettingsTab = 'brand' | 'hero' | 'features' | 'faqs' | 'partners' | 'payments';

import { useLocale } from 'next-intl';

export default function AdminSettingsPage() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [activeTab, setActiveTab] = useState<SettingsTab>('brand');

  const DEFAULT_THEME_COLORS = {
    primary: '#00685F', // DESIGN.md Official Primary (#00685F)
    background: '#020617',
    card_bg: '#1F2937',
    text_primary: '#FFFFFF',
    text_secondary: '#9CA3AF',
    partners_gap: 32,
  };

  const PRESET_PALETTES = [
    {
      id: 'ethos',
      name: isAr ? '🌟 نمط إيثوس الرسمي (DESIGN.md)' : '🌟 Ethos Teal (DESIGN.md)',
      tagline: isAr ? 'الألوان الرسمية المعتمدة (#00685F)' : 'Official brand primary teal (#00685F)',
      swatch: '#00685F',
      colors: {
        primary: '#00685F',
        background: '#020617',
        card_bg: '#1F2937',
        text_primary: '#FFFFFF',
        text_secondary: '#9CA3AF',
        partners_gap: 32,
      },
    },
    {
      id: 'warm_beige',
      name: isAr ? '☕ البيج الفاتح (Warm Canvas)' : '☕ Warm Editorial Light (#F9F5F0)',
      tagline: isAr ? 'خلفية دافئة بلون الورق الطبيعي (#F9F5F0)' : 'Warm paper-on-paper canvas (#F9F5F0)',
      swatch: '#00685F',
      colors: {
        primary: '#00685F',
        background: '#F9F5F0',
        card_bg: '#FFFFFF',
        text_primary: '#1B1C1C',
        text_secondary: '#605E5B',
        partners_gap: 32,
      },
    },
    {
      id: 'emerald',
      name: isAr ? '🌿 الأخضر الزمردي (Emerald Classic)' : '🌿 Emerald Vibrant (#10B981)',
      tagline: isAr ? 'أخضر رسائل الواتساب الحيوي (#10B981)' : 'Classic vibrant growth green (#10B981)',
      swatch: '#10B981',
      colors: {
        primary: '#10B981',
        background: '#020617',
        card_bg: '#1F2937',
        text_primary: '#FFFFFF',
        text_secondary: '#9CA3AF',
        partners_gap: 32,
      },
    },
    {
      id: 'midnight',
      name: isAr ? '🌌 النيلي الليلي (Midnight Indigo)' : '🌌 Midnight Indigo (#6366F1)',
      tagline: isAr ? 'كحلي داكن عصري وفخم (#6366F1)' : 'Deep indigo high-tech dark (#6366F1)',
      swatch: '#6366F1',
      colors: {
        primary: '#6366F1',
        background: '#0F172A',
        card_bg: '#1E293B',
        text_primary: '#F8FAFC',
        text_secondary: '#94A3B8',
        partners_gap: 32,
      },
    },
  ];

  const DEFAULT_SOCIAL_LINKS = [
    { platform: 'facebook', name: 'فيسبوك (Facebook)', url: '' },
    { platform: 'instagram', name: 'انستغرام (Instagram)', url: '' },
    { platform: 'twitter', name: 'إكس - تويتر (X / Twitter)', url: '' },
    { platform: 'linkedin', name: 'لينكد إن (LinkedIn)', url: '' },
    { platform: 'youtube', name: 'يوتيوب (YouTube)', url: '' },
    { platform: 'tiktok', name: 'تيك توك (TikTok)', url: '' },
    { platform: 'snapchat', name: 'سناب شات (Snapchat)', url: '' },
  ];

  const [platformName, setPlatformName] = useState('wacrm');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoHeight, setLogoHeight] = useState(48);
  const [supportEmail, setSupportEmail] = useState('support@wacrm.com');
  const [supportWhatsapp, setSupportWhatsapp] = useState('+966500000000');
  const [supportTelegram, setSupportTelegram] = useState('@wacrm_support');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [primaryColor, setPrimaryColor] = useState('#00685F');
  const [themeColors, setThemeColors] = useState(DEFAULT_THEME_COLORS);
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  function handleResetColors() {
    setThemeColors(DEFAULT_THEME_COLORS);
    setPrimaryColor(DEFAULT_THEME_COLORS.primary);
    toast.success(
      isAr
        ? 'تمت استعادة ألوان هوية DESIGN.md الرسمية (Ethos Automation #00685F) بنجاح 🎉 (اضغط حفظ التعديلات لتثبيتها 💾)'
        : 'Reset to official DESIGN.md colors (#00685F) successfully 🎉 (click Save Changes to persist 💾)'
    );
  }

  function handleApplyPreset(preset: typeof PRESET_PALETTES[number]) {
    setThemeColors(preset.colors);
    setPrimaryColor(preset.colors.primary);
    toast.success(
      isAr
        ? `تم تطبيق لوحة ${preset.name} بنجاح ✨ (اضغط حفظ التعديلات لتثبيتها 💾)`
        : `Applied ${preset.name} palette ✨ (click Save Changes to persist 💾)`
    );
  }

  // Landing Page Dynamic CMS States
  const [heroContent, setHeroContent] = useState({
    trust_badge_text: 'منصة أتمتة وتسويق الواتساب الأولى للشركات والمتاجر',
    trust_badge_text_en: '#1 WhatsApp Automation & Marketing Platform for Businesses',
    headline: 'نمِّ عملك مع',
    headline_en: 'Scale Your Business with',
    headline_highlight: 'واتساب والذكاء الاصطناعي',
    headline_highlight_en: 'WhatsApp & Gemini AI',
    subtitle:
      'منصة متكاملة تتيح لك أتمتة المحادثات، إرسال حملات البرودكاست الموجهة، وتوثيق المبيعات مع ربط Google Sheets وتنبيهات Telegram وربط فريقك بالكامل.',
    subtitle_en:
      'All-in-one platform to automate chat responses, trigger targeted broadcast campaigns, sync sales with Google Sheets, and notify your team via Telegram in real-time.',
    primary_cta_text: 'ابدأ مجاناً',
    primary_cta_text_en: 'Get Started Free',
    secondary_cta_text: 'تسجيل الدخول',
    secondary_cta_text_en: 'Login',
  });

  const [featuresContent, setFeaturesContent] = useState<FeatureItem[]>([
    {
      id: '1',
      title: '1. أتمتة المحادثات الذكية',
      title_en: '1. Smart AI Automation',
      description:
        'ردود فورية ومناقشات تفاعلية مدعومة بالذكاء الاصطناعي Gemini AI للإجابة على استفسارات العملاء وإتمام المبيعات 24/7.',
      description_en:
        '24/7 automated interactive conversations powered by Gemini AI to answer inquiries and close sales around the clock.',
    },
    {
      id: '2',
      title: '2. إدارة حملات البرودكاست',
      title_en: '2. Targeted Broadcasts',
      description:
        'إرسال رسائل وحملات تسويقية جماعية مخصصة لآلاف العملاء المستهدفين بضغطة زر واحدة مع تتبع دقيق لنسب الوصول والقراءة.',
      description_en:
        'Launch bulk WhatsApp marketing campaigns to thousands of targeted customers with 1-click and real-time delivery stats.',
    },
    {
      id: '3',
      title: '3. قوالب الرسائل الجاهزة',
      title_en: '3. Pre-Approved Templates',
      description:
        'إنشاء وتنظيم قوالب رسائل ترحيبية وتفاعلية قابلة للتخصيص لإرسال الإشعارات وتسهيل تواصل موظفي المبيعات.',
      description_en:
        'Create custom quick-reply templates and welcome sequences to speed up team responses and customer workflows.',
    },
    {
      id: '4',
      title: '4. تحليلات وتقارير ذكية',
      title_en: '4. Live Analytics & Insights',
      description:
        'إحصائيات مباشرة لمعدلات استهلاك الرسائل، أداء الحملات، وسجل تفاعل العملاء لاتخاذ قرارات تسويقية صائبة.',
      description_en:
        'Track campaign performance, message consumption, and customer engagement metrics with real-time dashboards.',
    },
    {
      id: '5',
      title: '5. ربط Google Sheets و Excel',
      title_en: '5. Google Sheets & Excel Export',
      description:
        'استخراج وتجميع كافة طلبات العملاء والعناوين والتلفونات تلقائياً وتصديرها بملفات إكسل مصفاة بضغطة زر.',
      description_en:
        'Automatically sync order data, contacts, and phone numbers into structured Excel files and Google Sheets.',
    },
    {
      id: '6',
      title: '6. إشعارات Telegram التلقائية',
      title_en: '6. Telegram Bot Alerts',
      description:
        'ربط إشعارات المبيعات والطلبات الجديدة ببوت التلغرام لتلقي تنبيه فوري ومباشر على جوالك فور تأكيد العميل للطلب.',
      description_en:
        'Receive instant notifications on your mobile via Telegram whenever a new lead or order is confirmed.',
    },
  ]);

  const [howItWorksContent, setHowItWorksContent] = useState<StepItem[]>([
    {
      step_number: '1',
      title: 'اربط واتساب',
      title_en: 'Connect WhatsApp',
      description:
        'افتح المنصة وامسح رمز الاستجابة السريعة (QR Code) بجوالك تماماً مثل فتح WhatsApp Web دون أي خبرة برمجة.',
      description_en:
        'Scan the QR code with your mobile WhatsApp app in seconds just like WhatsApp Web, zero coding needed.',
    },
    {
      step_number: '2',
      title: 'اضبط الرد الآلي',
      title_en: 'Configure AI Rules',
      description:
        'حدد قواعد الرد التلقائي، درّب مساعد الذكاء الاصطناعي Gemini على منتجاتك، وجهز قوالب الحملات.',
      description_en:
        'Set up automated response rules, train the Gemini AI assistant on your products, and prepare broadcast templates.',
    },
    {
      step_number: '3',
      title: 'ابدأ البيع والنمو',
      title_en: 'Scale & Close Sales',
      description:
        'استقبل الطلبات، أرسل البرودكاست، وتابع التقارير وتنبيهات التلغرام وتصدير إكسل بنجاح 24 ساعة يومياً.',
      description_en:
        'Receive incoming leads, send broadcasts, track performance, and automate orders 24/7 effortless.',
    },
  ]);

  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      id: '1',
      question: 'هل يحتاج ربط حساب الواتساب إلى خبرة برمجة؟',
      question_en: 'Does connecting WhatsApp require coding experience?',
      answer:
        'لا على الإطلاق! الربط يتم بسهولة فائقة عن طريق مسح رمز الاستجابة السريعة (QR Code) من تطبيق الواتساب بجوالك تماماً مثل فتح WhatsApp Web، وتعمل المنصة فوراً خلال أقل من دقيقتين.',
      answer_en:
        'Not at all! Linking is done seamlessly by scanning a QR Code from your WhatsApp mobile app, just like opening WhatsApp Web. The platform starts working in less than 2 minutes.',
    },
    {
      id: '2',
      question: 'هل المنصة آمنة وتدعم حماية رقم الواتساب من الحظر؟',
      question_en: 'Is the platform safe and protects my WhatsApp number from bans?',
      answer:
        'نعم، تم تصميم محرك المنصة بتقنيات أمان متقدمة تضمن إرسال الرسائل بمعدلات زمنية متدرجة وطبيعية (Safe Rate Limits)، مما يرفع كفاءة وصول الرسائل ويحمي حسابك بأمان تام.',
      answer_en:
        'Yes, the platform engine is engineered with safe rate limits and natural sending intervals, maximizing deliverability while fully safeguarding your WhatsApp account.',
    },
    {
      id: '3',
      question: 'كيف يعمل مساعد الذكاء الاصطناعي (Gemini AI) في الرد على العملاء؟',
      question_en: 'How does the Gemini AI assistant work for automatic replies?',
      answer:
        'يمكنك تغذية المساعد الذكي بمعلومات منتجاتك، سياسة المبيعات، ومصطلحات الدعم الخاص بك. يقوم المساعد بقراءة استفسارات العميل وفهمها ثم الرد بدقة بالغة واستخراج بيانات الطلبات تلقائياً.',
      answer_en:
        'You can train the AI assistant with your product info, sales rules, and support policies. It reads customer inquiries, understands intent, replies accurately, and extracts order data automatically.',
    },
    {
      id: '4',
      question: 'هل يمكنني تجربة المنصة مجاناً قبل الاشتراك في الخطة المدفوعة؟',
      question_en: 'Can I try the platform for free before subscribing?',
      answer:
        'بالتأكيد! نوفر خطة تجريبية مجانية تتيح لك اختبار كافة الخصائص، ربط الحساب، وإرسال الرسائل والتجربة الكاملة دون الحاجة لإدخال أي بطاقة ائتمانية.',
      answer_en:
        'Absolutely! We offer a free trial plan allowing you to test all features, link your account, send messages, and evaluate everything without requiring a credit card.',
    },
    {
      id: '5',
      question: 'ما هي طرق الدفع المتاحة للترقية؟',
      question_en: 'What payment methods are supported for upgrades?',
      answer:
        'ندعم طرق دفع متعددة تشمل البطاقات البنكية المباشرة عبر بوابة Stripe، بالإضافة للدفع بالعملات الرقمية المشفرة (USDT / BTC) عبر Plisio بالتفعيل الآلي الفوري.',
      answer_en:
        'We accept all major credit cards, debit cards, local cards, bank transfers, and direct cryptocurrency checkout via secure gateways.',
    },
  ]);

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([
    {
      id: '1',
      name: 'محمد السعيد',
      role: 'مؤسس متجر العطور الفاخرة',
      quote:
        'زيادة المبيعات بنسبة +40% خلال أول شهر من استخدام البرودكاست ومساعد الذكاء الاصطناعي. منصة استثنائية وسهلة للغاية!',
      stars: 5,
      avatar_initial: 'م',
    },
    {
      id: '2',
      name: 'ريم عبداللّه',
      role: 'مديرة خدمة العملاء - منصة أزياء',
      quote:
        'وفرت علينا ساعات طويلة من الردود اليدوية وتجميع طلبات التوصيل. الذكاء الاصطناعي يقوم بالعمل كاملاً وتصديره لـ Excel.',
      stars: 5,
      avatar_initial: 'ر',
    },
    {
      id: '3',
      name: 'فهد العتيبي',
      role: 'مدير العمليات - شركة الحلول الرقمية',
      quote:
        'ميزة دعوة الفريق مع التحكم بالصلاحيات وسلاسة الربط جعلت عمل موظفي المبيعات كأنهم يشتغلون على منصة واحدة موحدة.',
      stars: 5,
      avatar_initial: 'ف',
    },
  ]);

  const [ctaBannerContent, setCtaBannerContent] = useState({
    title: 'جاهز لمضاعفة مبيعاتك عبر الواتساب اليوم؟',
    subtitle:
      'ابدأ تجربتك الآن خلال أقل من دقيقتين بدون أي تعقيدات، مع ضمان كامل الأداء ودعم فني متاح دائماً.',
    button_text: 'انشئ حسابك المجاني الآن',
  });

  // New FAQ inputs
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqQuestionEn, setNewFaqQuestionEn] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqAnswerEn, setNewFaqAnswerEn] = useState('');

  // New Testimonial inputs
  const [newTestimonialName, setNewTestimonialName] = useState('');
  const [newTestimonialRole, setNewTestimonialRole] = useState('');
  const [newTestimonialQuote, setNewTestimonialQuote] = useState('');
  const [newTestimonialStars, setNewTestimonialStars] = useState(5);

  // Plisio Gateway State
  const [plisioEnabled, setPlisioEnabled] = useState(false);
  const [plisioSecretKey, setPlisioSecretKey] = useState('');
  const [plisioMerchantId, setPlisioMerchantId] = useState('');

  // Stripe Gateway State
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [showStripeSecret, setShowStripeSecret] = useState(false);

  // Partners State
  const [partners, setPartners] = useState<Partner[]>([]);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerLogo, setNewPartnerLogo] = useState('');
  const [addingPartner, setAddingPartner] = useState(false);

  // Edit Partner State
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [updatingPartner, setUpdatingPartner] = useState(false);

  const [loading, setLoading] = useState(true);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);

  async function handleLogoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل رفع ملف الشعار');

      if (data.url) {
        setLogoUrl(data.url);
        toast.success('تم رفع الشعار وتطبيقه بنجاح 🎉 (انقر على حفظ الشعار لتثبيته 💾)');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل رفع الشعار';
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function fetchSettingsAndPartners() {
    try {
      setLoading(true);
      const [settingsRes, partnersRes] = await Promise.all([
        fetch('/api/admin/site-settings').then((r) => r.json()),
        fetch('/api/admin/partners').then((r) => r.json()),
      ]);

      if (settingsRes.settings) {
        const s = settingsRes.settings;
        if (s.platform_name) setPlatformName(s.platform_name);
        if (s.logo_url !== undefined) setLogoUrl(s.logo_url || '');
        if (s.logo_height) setLogoHeight(s.logo_height);
        if (s.support_email) setSupportEmail(s.support_email);
        if (s.support_whatsapp) setSupportWhatsapp(s.support_whatsapp);
        if (s.support_telegram) setSupportTelegram(s.support_telegram);
        if (s.currency_symbol) setCurrencySymbol(s.currency_symbol);
        if (s.primary_color) setPrimaryColor(s.primary_color);
        if (s.theme_colors && typeof s.theme_colors === 'object') {
          setThemeColors({
            primary: s.theme_colors.primary || s.primary_color || '#10B981',
            background: s.theme_colors.background || '#020617',
            card_bg: s.theme_colors.card_bg || '#1F2937',
            text_primary: s.theme_colors.text_primary || '#FFFFFF',
            text_secondary: s.theme_colors.text_secondary || '#9CA3AF',
            partners_gap: s.theme_colors.partners_gap || 32,
          });
        } else if (s.primary_color) {
          setThemeColors((prev) => ({ ...prev, primary: s.primary_color }));
        }
        if (s.maintenance_mode !== undefined) setMaintenanceMode(Boolean(s.maintenance_mode));

        if (s.plisio_enabled !== undefined) setPlisioEnabled(Boolean(s.plisio_enabled));
        if (s.plisio_secret_key) setPlisioSecretKey(s.plisio_secret_key);
        if (s.plisio_merchant_id) setPlisioMerchantId(s.plisio_merchant_id);

        if (s.stripe_enabled !== undefined) setStripeEnabled(Boolean(s.stripe_enabled));
        if (s.stripe_publishable_key) setStripePublishableKey(s.stripe_publishable_key);
        if (s.stripe_secret_key) setStripeSecretKey(s.stripe_secret_key);
        if (s.stripe_webhook_secret) setStripeWebhookSecret(s.stripe_webhook_secret);

        if (s.social_links && Array.isArray(s.social_links)) {
          setSocialLinks((prev) =>
            prev.map((item) => {
              const found = (s.social_links as any[]).find(
                (x) => x.platform === item.platform || x.name === item.name
              );
              return found ? { ...item, url: found.url || '' } : item;
            })
          );
        }
        if (s.hero_content) setHeroContent(s.hero_content);
        if (s.features_content && Array.isArray(s.features_content))
          setFeaturesContent(s.features_content);
        if (s.how_it_works_content && Array.isArray(s.how_it_works_content))
          setHowItWorksContent(s.how_it_works_content);
        if (s.faqs && Array.isArray(s.faqs)) setFaqs(s.faqs);
        if (s.testimonials && Array.isArray(s.testimonials)) setTestimonials(s.testimonials);
        if (s.cta_banner_content) setCtaBannerContent(s.cta_banner_content);
      }

      setPartners((partnersRes.partners as Partner[]) ?? []);
    } catch (err) {
      console.error('[AdminSettings] Error fetching settings:', err);
      toast.error('تعذر تحميل إعدادات النظام');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettingsAndPartners();
  }, []);

  async function handleSaveSettings(section: string = 'global') {
    try {
      setSavingSection(section);
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_name: platformName,
          logo_url: logoUrl,
          logo_height: logoHeight,
          support_email: supportEmail,
          support_whatsapp: supportWhatsapp,
          support_telegram: supportTelegram,
          currency_symbol: currencySymbol,
          primary_color: themeColors.primary || primaryColor,
          theme_colors: themeColors,
          social_links: socialLinks,
          maintenance_mode: maintenanceMode,
          plisio_enabled: plisioEnabled,
          plisio_secret_key: plisioSecretKey,
          plisio_merchant_id: plisioMerchantId,
          stripe_enabled: stripeEnabled,
          stripe_publishable_key: stripePublishableKey,
          stripe_secret_key: stripeSecretKey,
          stripe_webhook_secret: stripeWebhookSecret,
          hero_content: heroContent,
          features_content: featuresContent,
          how_it_works_content: howItWorksContent,
          testimonials: testimonials,
          faqs: faqs,
          cta_banner_content: ctaBannerContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ الإعدادات');

      let successMsg = 'تم حفظ الإعدادات بنجاح ✅';
      if (section === 'brand') {
        successMsg = 'تم حفظ هوية المنصة والشعار والروابط بنجاح 🎉';
      } else if (section === 'hero') {
        successMsg = 'تم حفظ نصوص قسم الـ Hero والترويج بنجاح 🚀';
      } else if (section === 'features') {
        successMsg = 'تم حفظ الميزات الـ 6 وخطوات كيف يعمل بنجاح ⚡';
      } else if (section === 'faqs') {
        successMsg = 'تم حفظ الأسئلة الشائعة وتقييمات العملاء بنجاح ❓';
      } else if (section === 'partners') {
        successMsg = 'تم حفظ قائمة الشركاء بنجاح 🏢';
      } else if (section === 'payments') {
        successMsg = 'تم حفظ بوابات الدفع ووضع الصيانة بنجاح 💳';
      }

      toast.success(successMsg);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ الإعدادات العامة';
      toast.error(msg);
    } finally {
      setSavingSection(null);
    }
  }

  // Add FAQ Item
  function handleAddFaq() {
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      toast.error('يرجى كتابة السؤال والإجابة بالعربية على الأقل');
      return;
    }
    const newItem: FAQItem = {
      id: String(Date.now()),
      question: newFaqQuestion.trim(),
      question_en: newFaqQuestionEn.trim() || undefined,
      answer: newFaqAnswer.trim(),
      answer_en: newFaqAnswerEn.trim() || undefined,
    };
    setFaqs((prev) => [...prev, newItem]);
    setNewFaqQuestion('');
    setNewFaqQuestionEn('');
    setNewFaqAnswer('');
    setNewFaqAnswerEn('');
    toast.success('تمت إضافة السؤال للقائمة الضمنية! اضغط حفظ التعديلات لتثبيته 💾');
  }

  function handleDeleteFaq(index: number) {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
    toast.info('تم مسح السؤال! اضغط حفظ التعديلات لتأكيد الحذف 🗑️');
  }

  // Add Testimonial Item
  function handleAddTestimonial() {
    if (!newTestimonialName.trim() || !newTestimonialQuote.trim()) {
      toast.error('يرجى كتابة اسم العميل ونص التقييم');
      return;
    }
    const newItem: TestimonialItem = {
      id: String(Date.now()),
      name: newTestimonialName.trim(),
      role: newTestimonialRole.trim() || 'عميل في المنصة',
      quote: newTestimonialQuote.trim(),
      stars: newTestimonialStars,
      avatar_initial: newTestimonialName.trim().charAt(0),
    };
    setTestimonials((prev) => [...prev, newItem]);
    setNewTestimonialName('');
    setNewTestimonialRole('');
    setNewTestimonialQuote('');
    toast.success('تمت إضافة التقييم للقائمة! اضغط حفظ التعديلات لثبيته 💾');
  }

  function handleDeleteTestimonial(index: number) {
    setTestimonials((prev) => prev.filter((_, i) => i !== index));
    toast.info('تم مسح التقييم! اضغط حفظ التعديلات لتأكيد الحذف 🗑️');
  }

  // Partner handlers
  function startEditingPartner(partner: Partner) {
    setEditingPartnerId(partner.id);
    setEditName(partner.name);
    setEditLogoUrl(partner.logo_url || '');
  }

  async function handleUpdatePartner(partnerId: string) {
    if (!editName.trim()) {
      toast.error('اسم الشريك لا يمكن أن يكون فارغاً');
      return;
    }

    try {
      setUpdatingPartner(true);
      const res = await fetch('/api/admin/partners', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: partnerId,
          name: editName,
          logo_url: editLogoUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث الشريك');

      toast.success('تم تحديث بيانات الشريك بنجاح ✅');
      setPartners((prev) =>
        prev.map((p) => (p.id === partnerId ? { ...p, name: editName, logo_url: editLogoUrl } : p))
      );
      setEditingPartnerId(null);
    } catch (err) {
      toast.error('فشل تحديث بيانات الشريك');
    } finally {
      setUpdatingPartner(false);
    }
  }

  async function handleAddPartner() {
    if (!newPartnerName) {
      toast.error('يرجى كتابة اسم الشريك أو الشركة');
      return;
    }

    try {
      setAddingPartner(true);
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPartnerName,
          logo_url: newPartnerLogo,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إضافة الشريك');

      toast.success('تمت إضافة الشريك إلى الشريط المتحرك في الـ Landing Page 🎉');
      setPartners((prev) => [...prev, data.partner]);
      setNewPartnerName('');
      setNewPartnerLogo('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'فشل إضافة الشريك';
      toast.error(msg);
    } finally {
      setAddingPartner(false);
    }
  }

  async function handleDeletePartner(partnerId: string) {
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_id: partnerId }),
      });

      if (!res.ok) throw new Error('فشل حذف الشريك');

      toast.success('تم حذف الشريك بنجاح 🗑️');
      setPartners((prev) => prev.filter((p) => p.id !== partnerId));
    } catch (err) {
      toast.error('فشل حذف الشريك');
    }
  }

  const TABS_CONFIG = [
    {
      id: 'brand' as SettingsTab,
      label: isAr ? '1. الهوية والشعار والدعم' : '1. Branding, Logo & Support',
      icon: Globe,
      desc: isAr ? 'الاسم، اللوجو ومقاساته، أرقام الواتساب وتلغرام والدعم' : 'Platform name, logo size, WhatsApp, Telegram & support info',
    },
    {
      id: 'hero' as SettingsTab,
      label: isAr ? '2. قسم الـ Hero والترويج' : '2. Hero Section & Promotion',
      icon: Sparkles,
      desc: isAr ? 'العنوان الرئيسي، التظليل المضيء، الوصف وأزرار الحركة' : 'Main headline, highlight, subtitle, and CTA buttons',
    },
    {
      id: 'features' as SettingsTab,
      label: isAr ? '3. الميزات وشرح النظام' : '3. Features & How It Works',
      icon: Zap,
      desc: isAr ? 'نصوص بطاقات الميزات الـ 6 وخطوات كيف يعمل النظام الـ 3' : 'Texts for 6 feature cards and 3 how-it-works steps',
    },
    {
      id: 'faqs' as SettingsTab,
      label: isAr ? '4. الأسئلة والتقييمات' : '4. FAQs & Testimonials',
      icon: HelpCircle,
      desc: isAr ? 'محرر الأسئلة الشائعة، تقييمات العملاء، وبنر الختام' : 'FAQs manager, customer testimonials, and bottom CTA banner',
    },
    {
      id: 'partners' as SettingsTab,
      label: isAr ? '5. الشركاء والشريط المتحرك' : '5. Partners & Logo Marquee',
      icon: Building2,
      desc: isAr ? 'إدارة الشركات والشركاء في الشريط المتحرك السريع' : 'Manage partner logos & marquee slider',
    },
    {
      id: 'payments' as SettingsTab,
      label: isAr ? '6. بوابات الدفع الإلكتروني' : '6. Payment Gateways Config',
      icon: CreditCard,
      desc: isAr ? 'إعدادات ومفاتيح Stripe للبطاقات و Plisio للعملات الرقمية' : 'Stripe credit cards & Plisio crypto API keys config',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl flex items-center gap-2">
            <Layout className="h-7 w-7 text-emerald-500" /> {isAr ? 'إعدادات وتخصيص المنصة (Landing CMS)' : 'System Settings & Landing CMS'}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {isAr
              ? 'حدد القسم المطلوب من القائمة الجانبية للتحكم الشامل بجميع نصوص وصور وإعدادات المنصة'
              : 'Select a tab from the sidebar to manage platform branding, landing content, and settings.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSettingsAndPartners}
            disabled={loading}
            className="border-border text-xs font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 me-1.5 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث البيانات' : 'Refresh Data'}
          </Button>

          <Button
            size="sm"
            onClick={() => handleSaveSettings(activeTab)}
            disabled={savingSection !== null}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-slate-950 hover:brightness-110 shadow-md shadow-emerald-500/20 text-xs"
          >
            {savingSection !== null ? (
              <Loader2 className="h-4 w-4 animate-spin me-1.5" />
            ) : (
              <Save className="h-4 w-4 me-1.5" />
            )}
            {isAr ? 'حفظ التعديلات الحالية 💾' : 'Save Changes 💾'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">{isAr ? 'جاري تحميل البيانات...' : 'Loading settings data...'}</span>
        </div>
      ) : (
        /* Main Layout Grid: Sidebar Navigation on Right + Active Tab Content on Left */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Right Navigation Sidebar / Horizontal Tabs */}
          <div className="lg:col-span-1 space-y-2 bg-card p-3 rounded-2xl border border-border">
            <span className="text-[11px] font-black uppercase text-muted-foreground px-2 tracking-wider">
              {isAr ? 'أقسام التعديل والإعدادات' : 'Settings Categories'}
            </span>

            <div className="flex flex-col gap-1.5 pt-1">
              {TABS_CONFIG.map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl text-right transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black shadow-sm'
                        : 'hover:bg-muted/60 text-muted-foreground hover:text-foreground border border-transparent'
                    }`}
                  >
                    <div
                      className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-tight flex items-center justify-between">
                        <span>{tab.label}</span>
                        {isActive && <ChevronLeft className="h-3.5 w-3.5 text-emerald-400" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">
                        {tab.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Left Main Content Area (Renders ONLY the active tab) */}
          <div className="lg:col-span-3 space-y-6">
            {/* TAB 1: BRAND & LOGO & SUPPORT */}
            {activeTab === 'brand' && (
              <Card className="border border-border bg-card p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-base font-bold text-foreground">
                      {isAr ? 'هوية المنصة، اللوجو ومقاساته، وروابط الدعم' : 'Platform Identity, Logo & Support Links'}
                    </h2>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSaveSettings('brand')}
                    disabled={savingSection !== null}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
                  >
                    {savingSection === 'brand' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 me-1.5" />
                    )}
                    {isAr ? 'حفظ الهوية والشعار 💾' : 'Save Identity & Logo 💾'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                  {/* Platform Name */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">{isAr ? 'اسم المنصة الرئيسي' : 'Main Platform Name'}</label>
                    <div className="relative">
                      <Globe className="absolute start-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                        className="ps-9 bg-background border-border font-bold text-foreground"
                      />
                    </div>
                  </div>

                  {/* Currency Symbol */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground">{isAr ? 'رمز العملة (Currency Symbol)' : 'Currency Symbol ($)'}</label>
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

                  {/* Logo URL Input, File Upload & Preview */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>{isAr ? 'شعار المنصة / اللوجو (Logo URL or Device Upload)' : 'Platform Logo (URL or Device Upload)'}</span>
                      <span className="text-[11px] text-emerald-400 font-normal">
                        {isAr ? 'يمكنك أدخال رابط مباشر أو رفع صورة الشعار من جهازك' : 'Enter direct image URL or upload logo from your device'}
                      </span>
                    </label>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      {/* Option A: Direct URL Input */}
                      <div className="relative flex-1">
                        <ImageIcon className="absolute start-3 top-2.5 h-4 w-4 text-emerald-500" />
                        <Input
                          type="text"
                          placeholder={isAr ? 'https://.../logo.png (أو اختر رفع ملف)' : 'https://.../logo.png (or upload file)'}
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="ps-9 bg-background border-border font-mono dir-ltr text-xs"
                        />
                      </div>

                      {/* Option B: Upload File From Device Button */}
                      <div className="relative shrink-0">
                        <input
                          type="file"
                          id="logo-file-upload-input"
                          accept="image/*"
                          onChange={handleLogoFileUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadingLogo}
                          onClick={() => document.getElementById('logo-file-upload-input')?.click()}
                          className="border-emerald-500/50 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 font-bold text-xs cursor-pointer shadow-sm w-full sm:w-auto"
                        >
                          {uploadingLogo ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 me-1.5" />
                          )}
                          {isAr ? 'رفع شعار من الجهاز 📁' : 'Upload Logo File 📁'}
                        </Button>
                      </div>

                      {/* Option C: Delete / Clear Logo Button */}
                      {logoUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setLogoUrl('');
                            toast.info(isAr ? 'تم تفريغ الشعار. انقر على "حفظ الهوية والشعار" لتأكيد الحذف 🗑️' : 'Logo cleared. Click "Save Identity & Logo" to confirm deletion 🗑️');
                          }}
                          className="border-rose-500/40 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white font-bold text-xs cursor-pointer shadow-sm shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 me-1.5" />
                          {isAr ? 'حذف الشعار 🗑️' : 'Delete Logo 🗑️'}
                        </Button>
                      ) : null}

                      {/* Logo Live Preview with Checkerboard Transparency Grid */}
                      <div
                        className="h-14 px-4 rounded-xl border border-border flex items-center justify-center shrink-0 overflow-hidden min-w-[120px] relative shadow-inner"
                        style={{
                          backgroundImage: 'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                          backgroundSize: '12px 12px',
                          backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                          backgroundColor: '#0f172a',
                        }}
                      >
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt="Logo Preview"
                            style={{ height: `${logoHeight}px` }}
                            className="w-auto object-contain transition-all"
                          />
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                            {isAr ? 'اسم المنصة فقط' : 'Name Only'}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground/90">
                      💡 {isAr ? 'ملاحظة: لظهور الشعار بدون أي حواف بيضاء، تأكد من رفعه بصيغة PNG أو SVG مفرغة الخلفية (Transparent).' : 'Note: For a seamless logo, ensure uploading a Transparent PNG or SVG with no white background.'}
                    </p>
                  </div>

                  {/* Logo Height Dimension */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>{isAr ? 'ارتفاع وحجم الشعار بالبكسل (Logo Height)' : 'Logo Height & Size (Pixels)'}</span>
                      <span className="text-emerald-400 font-bold font-mono">{logoHeight}px</span>
                    </label>
                    <Input
                      type="number"
                      min={20}
                      max={180}
                      value={logoHeight}
                      onChange={(e) => setLogoHeight(Number(e.target.value))}
                      className="bg-background border-border text-xs font-mono"
                    />
                  </div>

                  {/* Full Landing Page Theme Colors Control & Reset Button */}
                  <div className="space-y-5 sm:col-span-2 pt-4 border-t border-border">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                          <Palette className="h-4 w-4 text-emerald-500" /> {isAr ? 'محرر ألوان وقوالب اللاندينغ بيج الكلي (Landing Page Theme Colors)' : 'Landing Page Theme Colors Editor'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isAr ? 'تخصيص ألوان الهوية، البطاقات، والعناوين أو اختيار لوحة جاهزة بنقرة واحدة من نظام DESIGN.md' : 'Customize brand colors, cards, and typography or pick a preset from DESIGN.md'}
                        </p>
                      </div>

                      {/* Reset Colors Button */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResetColors}
                        className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs shadow-sm shrink-0"
                      >
                        <RefreshCw className="h-3.5 w-3.5 me-1.5" />
                        {isAr ? 'إعادة ضبط الألوان للوضع الافتراضي (DESIGN.md) 🔄' : 'Reset Colors to Default (DESIGN.md) 🔄'}
                      </Button>
                    </div>

                    {/* Quick Preset Palettes Selection Grid */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {isAr ? '🎨 لوحات الألوان الجاهزة (Quick Presets):' : '🎨 Preset Palettes:'}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {PRESET_PALETTES.map((preset) => {
                          const isSelected =
                            themeColors.primary.toLowerCase() === preset.colors.primary.toLowerCase() &&
                            themeColors.background.toLowerCase() === preset.colors.background.toLowerCase();
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleApplyPreset(preset)}
                              className={cn(
                                "flex flex-col gap-1.5 p-3 rounded-xl border text-right transition-all duration-200 relative overflow-hidden",
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500/50"
                                  : "border-border bg-card/60 hover:bg-muted/50 hover:border-emerald-500/40 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                                    style={{ backgroundColor: preset.colors.primary }}
                                  />
                                  <span
                                    className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                                    style={{ backgroundColor: preset.colors.background }}
                                  />
                                  <span
                                    className="h-3.5 w-3.5 rounded-full border border-white/20 shadow-xs"
                                    style={{ backgroundColor: preset.colors.card_bg }}
                                  />
                                </div>
                                {isSelected && (
                                  <span className="text-[10px] font-black text-emerald-400 flex items-center gap-0.5">
                                    <Check className="h-3 w-3" /> {isAr ? 'محدد' : 'Active'}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-xs text-foreground mt-1">
                                {preset.name}
                              </div>
                              <p className="text-[10px] text-muted-foreground line-clamp-1">
                                {preset.tagline}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-muted/30 p-4 rounded-2xl border border-border text-xs">
                      {/* 1. Primary Accent */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">{isAr ? 'اللون الرئيسي والأزرار (Primary)' : 'Primary Accent & Buttons'}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={themeColors.primary}
                            onChange={(e) => {
                              setThemeColors({ ...themeColors, primary: e.target.value });
                              setPrimaryColor(e.target.value);
                            }}
                            className="h-9 w-12 p-1 bg-background border-border cursor-pointer shrink-0"
                          />
                          <Input
                            type="text"
                            value={themeColors.primary}
                            onChange={(e) => {
                              setThemeColors({ ...themeColors, primary: e.target.value });
                              setPrimaryColor(e.target.value);
                            }}
                            className="bg-background border-border font-mono uppercase text-xs"
                          />
                        </div>
                      </div>

                      {/* 2. Main Background */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">{isAr ? 'خلفية اللاندينغ الرئيسية (Background)' : 'Main Landing Background'}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={themeColors.background}
                            onChange={(e) => setThemeColors({ ...themeColors, background: e.target.value })}
                            className="h-9 w-12 p-1 bg-background border-border cursor-pointer shrink-0"
                          />
                          <Input
                            type="text"
                            value={themeColors.background}
                            onChange={(e) => setThemeColors({ ...themeColors, background: e.target.value })}
                            className="bg-background border-border font-mono uppercase text-xs"
                          />
                        </div>
                      </div>

                      {/* 3. Cards & Surfaces */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">{isAr ? 'خلفية البطاقات والأقسام (Cards Surface)' : 'Cards & Surfaces Background'}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={themeColors.card_bg}
                            onChange={(e) => setThemeColors({ ...themeColors, card_bg: e.target.value })}
                            className="h-9 w-12 p-1 bg-background border-border cursor-pointer shrink-0"
                          />
                          <Input
                            type="text"
                            value={themeColors.card_bg}
                            onChange={(e) => setThemeColors({ ...themeColors, card_bg: e.target.value })}
                            className="bg-background border-border font-mono uppercase text-xs"
                          />
                        </div>
                      </div>

                      {/* 4. Headings & Main Text */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">{isAr ? 'لون العناوين والنصوص الرئيسية (Main Text)' : 'Headings & Main Text Color'}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={themeColors.text_primary}
                            onChange={(e) => setThemeColors({ ...themeColors, text_primary: e.target.value })}
                            className="h-9 w-12 p-1 bg-background border-border cursor-pointer shrink-0"
                          />
                          <Input
                            type="text"
                            value={themeColors.text_primary}
                            onChange={(e) => setThemeColors({ ...themeColors, text_primary: e.target.value })}
                            className="bg-background border-border font-mono uppercase text-xs"
                          />
                        </div>
                      </div>

                      {/* 5. Subtitles & Descriptions */}
                      <div className="space-y-1.5">
                        <label className="font-semibold text-foreground">{isAr ? 'لون النصوص الفرعية والوصف (Subtitles)' : 'Subtitles & Description Color'}</label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={themeColors.text_secondary}
                            onChange={(e) => setThemeColors({ ...themeColors, text_secondary: e.target.value })}
                            className="h-9 w-12 p-1 bg-background border-border cursor-pointer shrink-0"
                          />
                          <Input
                            type="text"
                            value={themeColors.text_secondary}
                            onChange={(e) => setThemeColors({ ...themeColors, text_secondary: e.target.value })}
                            className="bg-background border-border font-mono uppercase text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Support */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>{isAr ? 'رقم الواتساب للدعم والتواصل' : 'WhatsApp Support Number'}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">{isAr ? '(اختياري - اتركه فارغاً للإخفاء)' : '(Optional - leave blank to hide)'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <MessageSquare className="absolute start-3 top-3 h-4 w-4 text-emerald-400" />
                        <Input
                          type="text"
                          placeholder={isAr ? '+966500000000 (اختياري)' : '+1234567890 (optional)'}
                          value={supportWhatsapp}
                          onChange={(e) => setSupportWhatsapp(e.target.value)}
                          className="ps-9 h-10 bg-background border-border dir-ltr rounded-xl text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveSettings('whatsapp')}
                        disabled={savingSection !== null}
                        className="h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm shrink-0"
                      >
                        {savingSection === 'whatsapp' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>{isAr ? 'حفظ 💾' : 'Save 💾'}</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Telegram Support */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>{isAr ? 'معرّف التلغرام للدعم والتواصل' : 'Telegram Support Handle'}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">{isAr ? '(اختياري - اتركه فارغاً للإخفاء)' : '(Optional - leave blank to hide)'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Send className="absolute start-3 top-3 h-4 w-4 text-blue-400" />
                        <Input
                          type="text"
                          placeholder={isAr ? '@wacrm_support (اختياري)' : '@support (optional)'}
                          value={supportTelegram}
                          onChange={(e) => setSupportTelegram(e.target.value)}
                          className="ps-9 h-10 bg-background border-border dir-ltr rounded-xl text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveSettings('telegram')}
                        disabled={savingSection !== null}
                        className="h-10 px-4 bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-sm shrink-0"
                      >
                        {savingSection === 'telegram' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>{isAr ? 'حفظ 💾' : 'Save 💾'}</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Support Email */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="font-semibold text-foreground flex items-center justify-between">
                      <span>{isAr ? 'بريد الدعم الفني (Support Email)' : 'Support Email Address'}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">{isAr ? '(اختياري - اتركه فارغاً للإخفاء)' : '(Optional - leave blank to hide)'}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="support@company.com"
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          className="ps-9 h-10 bg-background border-border dir-ltr rounded-xl text-xs"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveSettings('email')}
                        disabled={savingSection !== null}
                        className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-sm shrink-0"
                      >
                        {savingSection === 'email' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>{isAr ? 'حفظ 💾' : 'Save 💾'}</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Social Media Links Manager */}
                  <div className="space-y-4 sm:col-span-2 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-500" /> {isAr ? 'روابط وسائط التواصل الاجتماعي (Social Media Links)' : 'Social Media Links Manager'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {isAr ? 'أدخل روابط حساباتك الرسمية لتظهر كأيقونات تفاعلية في تذييل صفحة الهبوط أسفل الموقع (اترك الحقل فارغاً للإخفاء)' : 'Enter official links to display social icons in landing page footer (leave blank to hide)'}
                        </p>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleSaveSettings('social_links')}
                        disabled={savingSection !== null}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm shrink-0"
                      >
                        {savingSection === 'social_links' ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                        ) : (
                          <Save className="h-3.5 w-3.5 me-1.5" />
                        )}
                        {isAr ? 'حفظ روابط التواصل 💾' : 'Save Social Links 💾'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-2xl border border-border text-xs">
                      {socialLinks.map((item, idx) => (
                        <div key={item.platform} className="space-y-1">
                          <label className="font-semibold text-foreground flex items-center justify-between">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-muted-foreground font-normal">{isAr ? '(اختياري)' : '(Optional)'}</span>
                          </label>
                          <Input
                            type="url"
                            placeholder={`https://${item.platform}.com/yourpage`}
                            value={item.url}
                            onChange={(e) => {
                              const updated = [...socialLinks];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setSocialLinks(updated);
                            }}
                            className="bg-background border-border text-xs dir-ltr font-mono rounded-xl h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB 2: HERO CONTENT */}
            {activeTab === 'hero' && (
              <Card className="border border-border bg-card p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                    <h2 className="text-base font-bold text-foreground">
                      {isAr ? 'محرر قسم البطل والـ Hero Section' : 'Hero Section & Marketing Banner Editor'}
                    </h2>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSaveSettings('hero')}
                    disabled={savingSection !== null}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
                  >
                    {savingSection === 'hero' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 me-1.5" />
                    )}
                    {isAr ? 'حفظ الـ Hero 💾' : 'Save Hero Section 💾'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-5 text-xs">
                  {/* Headline AR & EN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-muted/20 p-4 border border-border">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>🇸🇦 {isAr ? 'بداية العنوان الرئيسي (بالعربية)' : 'Headline Start (Arabic)'}</span>
                      </label>
                      <Input
                        type="text"
                        value={heroContent.headline}
                        onChange={(e) => setHeroContent({ ...heroContent, headline: e.target.value })}
                        className="bg-background border-border font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground flex items-center gap-1.5">
                        <span>🇬🇧 {isAr ? 'Headline Start (in English)' : 'Headline Start (English)'}</span>
                      </label>
                      <Input
                        type="text"
                        value={heroContent.headline_en || ''}
                        onChange={(e) => setHeroContent({ ...heroContent, headline_en: e.target.value })}
                        className="bg-background border-border font-bold text-xs dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Headline Highlight AR & EN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-muted/20 p-4 border border-border">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span>🇸🇦 {isAr ? 'الكلمة المظللة باللون الأخضر (بالعربية)' : 'Highlighted Text (Arabic)'}</span>
                      </label>
                      <Input
                        type="text"
                        value={heroContent.headline_highlight}
                        onChange={(e) =>
                          setHeroContent({ ...heroContent, headline_highlight: e.target.value })
                        }
                        className="bg-background border-border border-emerald-500/40 text-emerald-400 font-black text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <span>🇬🇧 {isAr ? 'Headline Highlight (in English)' : 'Highlighted Text (English)'}</span>
                      </label>
                      <Input
                        type="text"
                        value={heroContent.headline_highlight_en || ''}
                        onChange={(e) =>
                          setHeroContent({ ...heroContent, headline_highlight_en: e.target.value })
                        }
                        className="bg-background border-border border-emerald-500/40 text-emerald-400 font-black text-xs dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Subtitle AR & EN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-muted/20 p-4 border border-border">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">🇸🇦 {isAr ? 'الوصف الفرعي للـ Hero (بالعربية)' : 'Hero Subtitle (Arabic)'}</label>
                      <textarea
                        rows={3}
                        value={heroContent.subtitle}
                        onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">🇬🇧 {isAr ? 'Hero Subtitle (in English)' : 'Hero Subtitle (English)'}</label>
                      <textarea
                        rows={3}
                        value={heroContent.subtitle_en || ''}
                        onChange={(e) => setHeroContent({ ...heroContent, subtitle_en: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground resize-none dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Trust Badge AR & EN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-muted/20 p-4 border border-border">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">🇸🇦 {isAr ? 'نص شارة التقييم العلوي (بالعربية)' : 'Trust Badge Text (Arabic)'}</label>
                      <Input
                        type="text"
                        value={heroContent.trust_badge_text}
                        onChange={(e) =>
                          setHeroContent({ ...heroContent, trust_badge_text: e.target.value })
                        }
                        className="bg-background border-border text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">🇬🇧 {isAr ? 'Trust Badge Text (in English)' : 'Trust Badge Text (English)'}</label>
                      <Input
                        type="text"
                        value={heroContent.trust_badge_text_en || ''}
                        onChange={(e) =>
                          setHeroContent({ ...heroContent, trust_badge_text_en: e.target.value })
                        }
                        className="bg-background border-border text-xs dir-ltr"
                      />
                    </div>
                  </div>

                  {/* Primary & Secondary CTAs AR & EN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-muted/20 p-4 border border-border">
                    <div className="space-y-2">
                      <label className="font-semibold text-foreground">{isAr ? 'زر الحركة الرئيسي (CTA 1)' : 'Primary Action Button (CTA 1)'}</label>
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          type="text"
                          placeholder={isAr ? '🇸🇦 بالعربية (مثال: ابدأ مجاناً)' : '🇸🇦 In Arabic'}
                          value={heroContent.primary_cta_text}
                          onChange={(e) =>
                            setHeroContent({ ...heroContent, primary_cta_text: e.target.value })
                          }
                          className="bg-background border-border font-bold text-xs"
                        />
                        <Input
                          type="text"
                          placeholder={isAr ? '🇬🇧 In English (e.g. Get Started Free)' : '🇬🇧 In English'}
                          value={heroContent.primary_cta_text_en || ''}
                          onChange={(e) =>
                            setHeroContent({ ...heroContent, primary_cta_text_en: e.target.value })
                          }
                          className="bg-background border-border font-bold text-xs dir-ltr"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-semibold text-foreground">{isAr ? 'زر الحركة الثانوي (CTA 2)' : 'Secondary Action Button (CTA 2)'}</label>
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          type="text"
                          placeholder={isAr ? '🇸🇦 بالعربية (مثال: تسجيل الدخول)' : '🇸🇦 In Arabic'}
                          value={heroContent.secondary_cta_text}
                          onChange={(e) =>
                            setHeroContent({ ...heroContent, secondary_cta_text: e.target.value })
                          }
                          className="bg-background border-border font-bold text-xs"
                        />
                        <Input
                          type="text"
                          placeholder={isAr ? '🇬🇧 In English (e.g. Login)' : '🇬🇧 In English'}
                          value={heroContent.secondary_cta_text_en || ''}
                          onChange={(e) =>
                            setHeroContent({ ...heroContent, secondary_cta_text_en: e.target.value })
                          }
                          className="bg-background border-border font-bold text-xs dir-ltr"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* TAB 3: FEATURES & HOW IT WORKS */}
            {activeTab === 'features' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Features 6 Cards Editor */}
                <Card className="border border-border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-emerald-500" />
                      <h2 className="text-base font-bold text-foreground">
                        {isAr ? 'محرر نصوص بطاقات الميزات الـ 6 (Features Cards)' : 'Features Cards Editor (6 Cards)'}
                      </h2>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSaveSettings('features')}
                      disabled={savingSection !== null}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      {savingSection === 'features' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5 me-1.5" />
                      )}
                      {isAr ? 'حفظ الميزات وكيف يعمل 💾' : 'Save Features & Steps 💾'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {featuresContent.map((feat, index) => (
                      <div
                        key={feat.id || index}
                        className="rounded-2xl border border-border bg-background p-4 space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="font-bold text-emerald-400">{isAr ? `البطاقة #${index + 1}` : `Card #${index + 1}`}</span>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇸🇦 {isAr ? 'عنوان الميزة (بالعربية)' : 'Feature Title (Arabic)'}</label>
                            <Input
                              type="text"
                              value={feat.title}
                              onChange={(e) => {
                                const updated = [...featuresContent];
                                updated[index].title = e.target.value;
                                setFeaturesContent(updated);
                              }}
                              className="bg-muted/50 border-border font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇬🇧 {isAr ? 'Feature Title (in English)' : 'Feature Title (English)'}</label>
                            <Input
                              type="text"
                              value={feat.title_en || ''}
                              onChange={(e) => {
                                const updated = [...featuresContent];
                                updated[index].title_en = e.target.value;
                                setFeaturesContent(updated);
                              }}
                              className="bg-muted/50 border-border font-bold text-xs dir-ltr"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇸🇦 {isAr ? 'وصف الميزة (بالعربية)' : 'Feature Description (Arabic)'}</label>
                            <textarea
                              rows={2}
                              value={feat.description}
                              onChange={(e) => {
                                const updated = [...featuresContent];
                                updated[index].description = e.target.value;
                                setFeaturesContent(updated);
                              }}
                              className="w-full rounded-xl border border-border bg-muted/50 p-2 text-xs leading-relaxed text-foreground resize-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇬🇧 {isAr ? 'Feature Description (in English)' : 'Feature Description (English)'}</label>
                            <textarea
                              rows={2}
                              value={feat.description_en || ''}
                              onChange={(e) => {
                                const updated = [...featuresContent];
                                updated[index].description_en = e.target.value;
                                setFeaturesContent(updated);
                              }}
                              className="w-full rounded-xl border border-border bg-muted/50 p-2 text-xs leading-relaxed text-foreground resize-none dir-ltr"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* How It Works 3 Steps */}
                <Card className="border border-border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-emerald-500" />
                      <h2 className="text-base font-bold text-foreground">
                        {isAr ? 'محرر خطوات "كيف يعمل النظام؟" (3 Steps)' : 'How It Works Editor (3 Steps)'}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {howItWorksContent.map((step, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border border-border bg-background p-4 space-y-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="font-black text-emerald-400 text-sm">
                            {isAr ? `الخطوة رقم #${step.step_number || index + 1}` : `Step #${step.step_number || index + 1}`}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇸🇦 {isAr ? 'عنوان الخطوة (بالعربية)' : 'Step Title (Arabic)'}</label>
                            <Input
                              type="text"
                              value={step.title}
                              onChange={(e) => {
                                const updated = [...howItWorksContent];
                                updated[index].title = e.target.value;
                                setHowItWorksContent(updated);
                              }}
                              className="bg-muted/50 border-border font-bold text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇬🇧 {isAr ? 'Step Title (in English)' : 'Step Title (English)'}</label>
                            <Input
                              type="text"
                              value={step.title_en || ''}
                              onChange={(e) => {
                                const updated = [...howItWorksContent];
                                updated[index].title_en = e.target.value;
                                setHowItWorksContent(updated);
                              }}
                              className="bg-muted/50 border-border font-bold text-xs dir-ltr"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇸🇦 {isAr ? 'شرح الخطوة (بالعربية)' : 'Step Description (Arabic)'}</label>
                            <textarea
                              rows={2}
                              value={step.description}
                              onChange={(e) => {
                                const updated = [...howItWorksContent];
                                updated[index].description = e.target.value;
                                setHowItWorksContent(updated);
                              }}
                              className="w-full rounded-xl border border-border bg-muted/50 p-2 text-xs leading-relaxed text-foreground resize-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">🇬🇧 {isAr ? 'Step Description (in English)' : 'Step Description (English)'}</label>
                            <textarea
                              rows={2}
                              value={step.description_en || ''}
                              onChange={(e) => {
                                const updated = [...howItWorksContent];
                                updated[index].description_en = e.target.value;
                                setHowItWorksContent(updated);
                              }}
                              className="w-full rounded-xl border border-border bg-muted/50 p-2 text-xs leading-relaxed text-foreground resize-none dir-ltr"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 4: FAQS & TESTIMONIALS & CTA */}
            {activeTab === 'faqs' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* FAQs Manager */}
                <Card className="border border-border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-emerald-500" />
                      <h2 className="text-base font-bold text-foreground">
                        {isAr ? 'محرر وإدارة الأسئلة الشائعة (FAQs Manager)' : 'FAQs Manager & Editor'}
                      </h2>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSaveSettings('faqs')}
                      disabled={savingSection !== null}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      {savingSection === 'faqs' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5 me-1.5" />
                      )}
                      {isAr ? 'حفظ الأسئلة والتقييمات 💾' : 'Save FAQs & Reviews 💾'}
                    </Button>
                  </div>

                  {/* Add New FAQ Box */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-4 text-xs">
                    <h3 className="font-bold text-emerald-400">
                      {isAr ? 'إضافة سؤال شائع جديد (عربي وإنجليزي) ➕' : 'Add New FAQ (Arabic & English) ➕'}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground">🇸🇦 {isAr ? 'السؤال (بالعربية):' : 'Question (Arabic):'}</label>
                        <Input
                          type="text"
                          placeholder={isAr ? 'صيغة السؤال بالعربية...' : 'Question wording in Arabic...'}
                          value={newFaqQuestion}
                          onChange={(e) => setNewFaqQuestion(e.target.value)}
                          className="bg-background border-border text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground">🇬🇧 {isAr ? 'Question (in English):' : 'Question (English):'}</label>
                        <Input
                          type="text"
                          placeholder={isAr ? 'Question in English...' : 'Question wording in English...'}
                          value={newFaqQuestionEn}
                          onChange={(e) => setNewFaqQuestionEn(e.target.value)}
                          className="bg-background border-border text-xs dir-ltr"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground">🇸🇦 {isAr ? 'الإجابة (بالعربية):' : 'Answer (Arabic):'}</label>
                        <textarea
                          rows={2}
                          placeholder={isAr ? 'الإجابة الشافية عن السؤال بالعربية...' : 'Answer details in Arabic...'}
                          value={newFaqAnswer}
                          onChange={(e) => setNewFaqAnswer(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground resize-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-foreground">🇬🇧 {isAr ? 'Answer (in English):' : 'Answer (English):'}</label>
                        <textarea
                          rows={2}
                          placeholder={isAr ? 'Answer details in English...' : 'Answer details in English...'}
                          value={newFaqAnswerEn}
                          onChange={(e) => setNewFaqAnswerEn(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground resize-none dir-ltr"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleAddFaq}
                        className="bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                      >
                        {isAr ? 'إضافة السؤال للقائمة ➕' : 'Add FAQ to List ➕'}
                      </Button>
                    </div>
                  </div>

                  {/* Existing FAQs List */}
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
                      <div
                        key={faq.id || index}
                        className="rounded-2xl border border-border bg-background p-4 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="font-bold text-emerald-400 text-xs">{isAr ? `سؤال #${index + 1}` : `Question #${index + 1}`}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteFaq(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                            title={isAr ? 'حذف السؤال' : 'Delete Question'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-semibold text-foreground text-[11px]">🇸🇦 {isAr ? 'السؤال بالعربية' : 'Question in Arabic'}</label>
                              <Input
                                type="text"
                                value={faq.question}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].question = e.target.value;
                                  setFaqs(updated);
                                }}
                                className="bg-muted/40 border-border font-bold text-xs"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-foreground text-[11px]">🇬🇧 {isAr ? 'Question in English' : 'Question in English'}</label>
                              <Input
                                type="text"
                                value={faq.question_en || ''}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].question_en = e.target.value;
                                  setFaqs(updated);
                                }}
                                className="bg-muted/40 border-border font-bold text-xs dir-ltr"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-semibold text-foreground text-[11px]">🇸🇦 {isAr ? 'الإجابة بالعربية' : 'Answer in Arabic'}</label>
                              <textarea
                                rows={2}
                                value={faq.answer}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].answer = e.target.value;
                                  setFaqs(updated);
                                }}
                                className="w-full rounded-xl border border-border bg-muted/40 p-2 text-xs leading-relaxed text-foreground resize-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-semibold text-foreground text-[11px]">🇬🇧 {isAr ? 'Answer in English' : 'Answer in English'}</label>
                              <textarea
                                rows={2}
                                value={faq.answer_en || ''}
                                onChange={(e) => {
                                  const updated = [...faqs];
                                  updated[index].answer_en = e.target.value;
                                  setFaqs(updated);
                                }}
                                className="w-full rounded-xl border border-border bg-muted/40 p-2 text-xs leading-relaxed text-foreground resize-none dir-ltr"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Testimonials Manager */}
                <Card className="border border-border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-[#00E785]" />
                      <h2 className="text-base font-bold text-foreground">
                        {isAr ? 'محرر تقييمات وآراء العملاء (Testimonials)' : 'Testimonials & Customer Reviews Editor'}
                      </h2>
                    </div>
                  </div>

                  {/* Add New Testimonial Box */}
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 text-xs">
                    <h3 className="font-bold text-emerald-400">
                      {isAr ? 'إضافة رأي وتقييم عميل جديد ➕' : 'Add New Customer Testimonial ➕'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Input
                        type="text"
                        placeholder={isAr ? 'اسم العميل' : 'Customer Name'}
                        value={newTestimonialName}
                        onChange={(e) => setNewTestimonialName(e.target.value)}
                        className="bg-background border-border text-xs"
                      />
                      <Input
                        type="text"
                        placeholder={isAr ? 'الصفة/المتجر' : 'Role / Company / Store'}
                        value={newTestimonialRole}
                        onChange={(e) => setNewTestimonialRole(e.target.value)}
                        className="bg-background border-border text-xs"
                      />
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-foreground">{isAr ? 'النجوم:' : 'Rating:'}</label>
                        <select
                          value={newTestimonialStars}
                          onChange={(e) => setNewTestimonialStars(Number(e.target.value))}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                        >
                          <option value={5}>{isAr ? '5 نجوم ⭐⭐⭐⭐⭐' : '5 Stars ⭐⭐⭐⭐⭐'}</option>
                          <option value={4}>{isAr ? '4 نجوم ⭐⭐⭐⭐' : '4 Stars ⭐⭐⭐⭐'}</option>
                          <option value={3}>{isAr ? '3 نجوم ⭐⭐⭐' : '3 Stars ⭐⭐⭐'}</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      placeholder={isAr ? 'نص رأي وتقييم العميل...' : 'Customer review quote text...'}
                      value={newTestimonialQuote}
                      onChange={(e) => setNewTestimonialQuote(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground resize-none"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={handleAddTestimonial}
                        className="bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
                      >
                        {isAr ? 'إضافة التقييم للقائمة ➕' : 'Add Review to List ➕'}
                      </Button>
                    </div>
                  </div>

                  {/* Testimonials List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {testimonials.map((item, index) => (
                      <div
                        key={item.id || index}
                        className="rounded-2xl border border-border bg-background p-4 space-y-3 relative flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between border-b border-border pb-2">
                          <span className="font-bold text-emerald-400 text-xs">{isAr ? `تقييم #${index + 1}` : `Review #${index + 1}`}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTestimonial(index)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-500"
                            title={isAr ? 'حذف التقييم' : 'Delete Review'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <Input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...testimonials];
                              updated[index].name = e.target.value;
                              setTestimonials(updated);
                            }}
                            placeholder={isAr ? 'اسم العميل' : 'Customer Name'}
                            className="bg-muted/40 border-border font-bold text-xs"
                          />
                          <Input
                            type="text"
                            value={item.role}
                            onChange={(e) => {
                              const updated = [...testimonials];
                              updated[index].role = e.target.value;
                              setTestimonials(updated);
                            }}
                            placeholder={isAr ? 'الصفة' : 'Role'}
                            className="bg-muted/40 border-border text-xs"
                          />
                          <textarea
                            rows={3}
                            value={item.quote}
                            onChange={(e) => {
                              const updated = [...testimonials];
                              updated[index].quote = e.target.value;
                              setTestimonials(updated);
                            }}
                            placeholder={isAr ? 'نص التقييم...' : 'Quote text...'}
                            className="w-full rounded-xl border border-border bg-muted/40 p-2 text-xs leading-relaxed text-foreground resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* CTA Banner Editor */}
                <Card className="border border-border bg-card p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Send className="h-5 w-5 text-emerald-500" />
                      <h2 className="text-base font-bold text-foreground">
                        {isAr ? 'محرر بنر الختام والدعوة للتسجيل (CTA Banner)' : 'CTA Bottom Banner & Registration Editor'}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-foreground">{isAr ? 'عنوان بنر الختام' : 'Bottom Banner Headline'}</label>
                      <Input
                        type="text"
                        value={ctaBannerContent.title}
                        onChange={(e) =>
                          setCtaBannerContent({ ...ctaBannerContent, title: e.target.value })
                        }
                        className="bg-background border-border font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-foreground">{isAr ? 'الوصف تحت بنر الختام' : 'Bottom Banner Subtitle'}</label>
                      <textarea
                        rows={2}
                        value={ctaBannerContent.subtitle}
                        onChange={(e) =>
                          setCtaBannerContent({ ...ctaBannerContent, subtitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">{isAr ? 'نص زر الحركة ببنر الختام' : 'CTA Button Text'}</label>
                      <Input
                        type="text"
                        value={ctaBannerContent.button_text}
                        onChange={(e) =>
                          setCtaBannerContent({ ...ctaBannerContent, button_text: e.target.value })
                        }
                        className="bg-background border-border font-bold text-xs"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB 5: PARTNERS */}
            {activeTab === 'partners' && (
              <Card className="border border-border bg-card p-6 space-y-6 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-emerald-500" />
                    <div>
                      <h2 className="text-base font-bold text-foreground">
                        {isAr ? 'إدارة الشركاء والشريط المتحرك (Partners Marquee Ticker)' : 'Partners & Marquee Ticker Manager'}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? 'تظهر في الشريط المتحرك السريع في اللاندينغ بيج لإبراز ثقة المنصات والشركاء' : 'Displays partner logos in the animated landing marquee ticker'}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSaveSettings('partners')}
                    disabled={savingSection !== null}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
                  >
                    {savingSection === 'partners' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                    ) : (
                      <Save className="h-3.5 w-3.5 me-1.5" />
                    )}
                    {isAr ? 'حفظ التعديلات 💾' : 'Save Changes 💾'}
                  </Button>
                </div>

                {/* Partners Logo Spacing Control Slider */}
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-emerald-500" /> {isAr ? 'المسافة والتباعد بين شعارات الشركاء (Partner Logos Spacing)' : 'Partner Logos Spacing & Gap'}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isAr ? 'التحكم بالمسافة بين شعارات الشركاء بالبكسل في صفحة الهبوط لمنع تلاصقها' : 'Control spacing gap between partner logos in pixels'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        {themeColors.partners_gap || 32}px
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Input
                      type="range"
                      min={12}
                      max={80}
                      step={2}
                      value={themeColors.partners_gap || 32}
                      onChange={(e) => setThemeColors({ ...themeColors, partners_gap: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <Input
                      type="number"
                      min={12}
                      max={80}
                      value={themeColors.partners_gap || 32}
                      onChange={(e) => setThemeColors({ ...themeColors, partners_gap: Number(e.target.value) })}
                      className="w-24 h-9 bg-background border-border font-mono text-xs text-center"
                    />
                  </div>
                </div>

                {/* Add New Partner */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs bg-muted/30 p-4 rounded-xl border border-border">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">{isAr ? 'اسم الشريك / الشركة' : 'Partner / Company Name'}</label>
                    <Input
                      type="text"
                      placeholder={isAr ? 'مثال: Shopify / Meta' : 'e.g. Shopify / Meta'}
                      value={newPartnerName}
                      onChange={(e) => setNewPartnerName(e.target.value)}
                      className="bg-background border-border text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">{isAr ? 'رابط اللوجو / الصورة' : 'Logo / Image URL'}</label>
                    <Input
                      type="text"
                      placeholder={isAr ? 'https://.../logo.png (اختياري)' : 'https://.../logo.png (optional)'}
                      value={newPartnerLogo}
                      onChange={(e) => setNewPartnerLogo(e.target.value)}
                      className="bg-background border-border text-xs dir-ltr font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      size="sm"
                      onClick={handleAddPartner}
                      disabled={addingPartner || !newPartnerName}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      {addingPartner ? (
                        <Loader2 className="h-4 w-4 animate-spin me-1.5" />
                      ) : (
                        <Plus className="h-4 w-4 me-1" />
                      )}
                      {isAr ? 'إضافة شريك جديد ➕' : 'Add New Partner ➕'}
                    </Button>
                  </div>
                </div>

                {/* Partners List */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {partners.map((p) =>
                    editingPartnerId === p.id ? (
                      <div
                        key={p.id}
                        className="col-span-1 sm:col-span-2 rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-3 space-y-2 shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400">
                            {isAr ? `تعديل الشريك: ${p.name}` : `Edit Partner: ${p.name}`}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingPartnerId(null)}
                            className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">{isAr ? 'اسم الشريك' : 'Partner Name'}</label>
                            <Input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 bg-background border-border text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-semibold text-foreground text-[11px]">{isAr ? 'رابط اللوجو' : 'Logo URL'}</label>
                            <Input
                              type="text"
                              value={editLogoUrl}
                              onChange={(e) => setEditLogoUrl(e.target.value)}
                              className="h-8 bg-background border-border text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPartnerId(null)}
                            className="h-7 text-xs"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePartner(p.id)}
                            disabled={updatingPartner || !editName.trim()}
                            className="h-7 bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 text-xs"
                          >
                            {updatingPartner ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin me-1" />
                            ) : (
                              <Check className="h-3.5 w-3.5 me-1" />
                            )}
                            {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 shadow-sm hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {p.logo_url ? (
                            <img src={p.logo_url} alt={p.name} className="h-6 w-6 object-contain shrink-0" />
                          ) : (
                            <div className="h-6 w-6 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0">
                              {p.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditingPartner(p)}
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-400"
                            title={isAr ? 'تعديل الاسم أو اللوجو' : 'Edit Name or Logo'}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePartner(p.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            title={isAr ? 'حذف الشريك' : 'Delete Partner'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Card>
            )}

            {/* TAB 6: PAYMENTS & MAINTENANCE */}
            {activeTab === 'payments' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Plisio Gateway Settings Card */}
                <Card className="border border-amber-500/40 bg-card p-6 space-y-6 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-amber-500" />
                      <div>
                        <h2 className="text-base font-bold text-foreground">
                          {isAr ? 'بوابة دفع العملات الرقمية Plisio (Crypto Payment Gateway)' : 'Plisio Crypto Payment Gateway'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? 'تتطلب الـ Secret Key من حسابك في Plisio لإنشاء فواتير الكريبتو وتأكيد الدفع تلقائياً' : 'Requires Plisio Secret Key to generate crypto invoices & auto-confirm payments'}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleSaveSettings('payments')}
                      disabled={savingSection !== null}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm"
                    >
                      {savingSection === 'payments' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin me-1.5" />
                      ) : (
                        <Save className="h-3.5 w-3.5 me-1.5" />
                      )}
                      {isAr ? 'حفظ إعدادات الدفع والصيانة 💾' : 'Save Payments & Maintenance 💾'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-foreground flex items-center justify-between">
                        <span>{isAr ? 'حالة تفعيل بوابة Plisio للدفع بالكريبتو (Plisio Active Status)' : 'Plisio Crypto Gateway Active Status'}</span>
                        <span
                          className={`font-bold ${
                            plisioEnabled ? 'text-emerald-400' : 'text-muted-foreground'
                          }`}
                        >
                          {plisioEnabled ? (isAr ? 'مفعّلة 🟢' : 'Active 🟢') : (isAr ? 'معطّلة 🔴' : 'Disabled 🔴')}
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant={plisioEnabled ? 'default' : 'outline'}
                        onClick={() => setPlisioEnabled(!plisioEnabled)}
                        className={`w-full font-bold text-xs ${
                          plisioEnabled
                            ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {plisioEnabled
                          ? (isAr ? 'تخفيض / تعطيل Plisio' : 'Disable Plisio Gateway')
                          : (isAr ? 'تفعيل بوابة Plisio الآن 🚀' : 'Enable Plisio Gateway Now 🚀')}
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">
                        {isAr ? 'Plisio Secret Key (المتاح في Dashboard)' : 'Plisio Secret Key'}
                      </label>
                      <Input
                        type="password"
                        placeholder="Secret Key..."
                        value={plisioSecretKey}
                        onChange={(e) => setPlisioSecretKey(e.target.value)}
                        className="bg-background border-border font-mono text-xs dir-ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">{isAr ? 'Plisio Merchant ID (اختياري)' : 'Plisio Merchant ID (Optional)'}</label>
                      <Input
                        type="text"
                        placeholder="Merchant ID..."
                        value={plisioMerchantId}
                        onChange={(e) => setPlisioMerchantId(e.target.value)}
                        className="bg-background border-border font-mono text-xs dir-ltr"
                      />
                    </div>
                  </div>
                </Card>

                {/* Stripe Credit Card Payment Gateway */}
                <Card className="border border-indigo-500/40 bg-card p-6 space-y-6 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-indigo-400" />
                      <div>
                        <h2 className="text-base font-bold text-foreground">
                          {isAr ? 'بوابة دفع البطاقات Stripe (Credit / Debit Cards Gateway)' : 'Stripe Credit/Debit Cards Gateway'}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {isAr ? 'تسمح للعملاء بالدفع بالبطاقات البنكية Visa/Mastercard للترقية الفورية للخطط' : 'Allows clients to pay with Visa/Mastercard credit cards for instant plan upgrades'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-foreground flex items-center justify-between">
                        <span>{isAr ? 'حالة تفعيل بوابة Stripe بالبطاقات (Stripe Active Status)' : 'Stripe Cards Gateway Active Status'}</span>
                        <span
                          className={`font-bold ${
                            stripeEnabled ? 'text-indigo-400' : 'text-muted-foreground'
                          }`}
                        >
                          {stripeEnabled ? (isAr ? 'مفعّلة 🟢' : 'Active 🟢') : (isAr ? 'معطّلة 🔴' : 'Disabled 🔴')}
                        </span>
                      </label>
                      <Button
                        type="button"
                        variant={stripeEnabled ? 'default' : 'outline'}
                        onClick={() => setStripeEnabled(!stripeEnabled)}
                        className={`w-full font-bold text-xs ${
                          stripeEnabled
                            ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {stripeEnabled
                          ? (isAr ? 'تعطيل Stripe' : 'Disable Stripe Gateway')
                          : (isAr ? 'تفعيل بوابة Stripe للبطاقات 🚀' : 'Enable Stripe Gateway Now 🚀')}
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">
                        Stripe Publishable Key (pk_live_... / pk_test_...)
                      </label>
                      <Input
                        type="text"
                        placeholder="pk_test_..."
                        value={stripePublishableKey}
                        onChange={(e) => setStripePublishableKey(e.target.value)}
                        className="bg-background border-border font-mono text-xs dir-ltr"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground flex items-center justify-between">
                        <span>Stripe Secret Key (sk_live_... / sk_test_...)</span>
                        <button
                          type="button"
                          onClick={() => setShowStripeSecret(!showStripeSecret)}
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          {showStripeSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {showStripeSecret ? (isAr ? 'إخفاء المفتاح' : 'Hide Key') : (isAr ? 'إظهار المفتاح' : 'Show Key')}
                        </button>
                      </label>
                      <Input
                        type={showStripeSecret ? 'text' : 'password'}
                        placeholder="sk_test_..."
                        value={stripeSecretKey}
                        onChange={(e) => setStripeSecretKey(e.target.value)}
                        className="bg-background border-border font-mono text-xs dir-ltr"
                      />
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="font-semibold text-foreground">Stripe Webhook Secret (whsec_...)</label>
                      <Input
                        type="password"
                        placeholder="whsec_..."
                        value={stripeWebhookSecret}
                        onChange={(e) => setStripeWebhookSecret(e.target.value)}
                        className="bg-background border-border font-mono text-xs dir-ltr"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
