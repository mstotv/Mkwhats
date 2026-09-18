'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Network,
  ShieldCheck,
  TrendingUp,
  Globe,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Building2,
  DollarSign,
  Zap,
} from 'lucide-react';

export function LandingResellerShowcase() {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const pillars = [
    {
      icon: Network,
      color: 'emerald',
      title: isAr ? 'هوية مستقلة 100% بدون أي ذكر لنا' : '100% White-Label (No Platform Trace)',
      desc: isAr
        ? 'منصتك تظهر باسم شركتك، شعارك الخاص، ألوانك، وبيانات الدعم الخاصة بك دون أي أثر لمنصتنا الأصلية.'
        : 'Your customers only see your brand name, logo, theme colors, and support contacts without any trace of our origin.',
    },
    {
      icon: Globe,
      color: 'blue',
      title: isAr ? 'دومين مخصص وساب دومين سحابي' : 'Custom Domain (CNAME) & Subdomain',
      desc: isAr
        ? 'احصل على ساب دومين فوري مجاني أو اربط دومينك الخاص (crm.youragency.com) مع شهادة SSL تلقائية مجانية.'
        : 'Get an instant free subdomain or connect your own agency domain with free automated wildcard SSL.',
    },
    {
      icon: DollarSign,
      color: 'amber',
      title: isAr ? 'أرباح متكررة 100% لك دون أي عمولة' : 'Keep 100% of Your Client Revenue',
      desc: isAr
        ? 'حدد أسعار باقاتك بحرية كاملة، واستلم مدفوعات عملائك مباشرة في حسابك البنكي أو بوابات دفعك دون أي اقتطاع.'
        : 'Set your own subscription prices, connect your payment gateway, and collect recurring payments directly.',
    },
    {
      icon: Zap,
      color: 'purple',
      title: isAr ? 'بنية تحتية سحابية متكاملة فورية' : 'Turnkey Enterprise WhatsApp SaaS',
      desc: isAr
        ? 'بوتات الذكاء الاصطناعي، ربط واتساب الرسمي و QR، منشئ التدفقات، واسترداد السلات كلها جاهزة لعملائك دون كتابة سطر كود.'
        : 'AI conversational bots, WhatsApp QR scanning, visual flow builder, and abandoned carts ready out-of-the-box.',
    },
  ];

  return (
    <section className="py-20 sm:py-28 relative overflow-hidden bg-white/60 dark:bg-[#1f1f1f]/60 border-y border-[#BCC9C6]/30 dark:border-white/10">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 relative z-10 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{isAr ? 'برنامج الموزعين والوكالات (White-Label Reseller)' : 'White-Label Agency Partner Program'}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#1B1C1C] dark:text-white leading-tight">
            {isAr
              ? 'أطلق منصتك الخاصة لواتساب CRM بعلامتك التجارية الكاملة'
              : 'Launch Your Own Branded WhatsApp CRM with 100% White-Label'}
          </h2>

          <p className="text-base sm:text-lg text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
            {isAr
              ? 'حوّل خبرتك أو وكالتك التسويقية إلى شركة برمجيات SaaS ذات دخل شهري متكرر. نمنحك النظام بالكامل، وأنت تمتلك العلامة والعملاء والأرباح.'
              : 'Turn your agency into a recurring SaaS software business. We provide the complete cloud infrastructure; you own the brand, clients, and 100% of the profits.'}
          </p>
        </div>

        {/* 4 Value Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-[#242424] border border-[#EFEDED] dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#1B1C1C] dark:text-white leading-snug">
                    {p.title}
                  </h3>
                  <p className="text-xs text-[#605E5B] dark:text-[#C9C6C1] leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats Strip & Action */}
        <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-start">
            <h3 className="text-2xl sm:text-3xl font-black">
              {isAr ? 'جاهز لإطلاق منصة الـ SaaS الخاصة بك اليوم؟' : 'Ready to Launch Your SaaS Business Today?'}
            </h3>
            <p className="text-sm text-emerald-100 max-w-xl">
              {isAr
                ? 'استعرض باقات الموزعين المرنة واختر الباقة التي تناسب طموحك، وابدأ في استقبال عملائك خلال دقائق معدودة.'
                : 'Explore flexible reseller tiers, configure your white-label brand, and onboard your first clients within minutes.'}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/pricing">
              <button
                type="button"
                className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>{isAr ? 'استكشف باقات الموزعين' : 'View Reseller Plans'}</span>
                <ArrowIcon className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
