"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, CreditCard, XCircle, Globe, Moon, Sun } from "lucide-react";
import { useLocale } from "next-intl";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function getCachedSiteSettings() {
  if (typeof window === "undefined") {
    return { platform_name: "Whatapp Automation", primary_color: "#00A389", google_auth_enabled: true };
  }
  try {
    const cached = localStorage.getItem("mk_site_settings");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        platform_name: parsed.platform_name || parsed.platform_name_en || "Whatapp Automation",
        platform_name_ar: parsed.platform_name_ar || "واتساب أوتوميشن",
        platform_name_en: parsed.platform_name_en || "Whatapp Automation",
        logo_url: parsed.logo_url || "",
        logo_height: parsed.logo_height || 32,
        primary_color: parsed.primary_color || "#00A389",
        google_auth_enabled: parsed.google_auth_enabled !== undefined ? !!parsed.google_auth_enabled : true,
      };
    }
  } catch {}
  return { platform_name: "Whatapp Automation", primary_color: "#00A389", google_auth_enabled: true };
}

function SignupPageInner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cachedSettings = getCachedSiteSettings();
  const [platformName, setPlatformName] = useState<string>(cachedSettings.platform_name);
  const [logoUrl, setLogoUrl] = useState<string>(cachedSettings.logo_url || "");
  const [logoHeight, setLogoHeight] = useState<number>(cachedSettings.logo_height || 32);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState<boolean>(cachedSettings.google_auth_enabled);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.platform_name) setPlatformName(isAr ? (data.settings.platform_name_ar || data.settings.platform_name) : (data.settings.platform_name_en || data.settings.platform_name));
          if (data.settings.logo_url) setLogoUrl(data.settings.logo_url);
          if (data.settings.logo_height) setLogoHeight(data.settings.logo_height);
          if (data.settings.google_auth_enabled !== undefined) setGoogleAuthEnabled(!!data.settings.google_auth_enabled);
          try { localStorage.setItem("mk_site_settings", JSON.stringify(data.settings)); } catch {}
        }
      })
      .catch(() => {});
  }, [isAr]);

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback${inviteToken ? `?next=/join/${encodeURIComponent(inviteToken)}` : ""}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "فشل الاتصال بـ Google");
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError(isAr ? "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية" : "You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (password.length < 6) {
      setError(isAr ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const emailRedirectTo = inviteToken
      ? `${window.location.origin}/join/${encodeURIComponent(inviteToken)}`
      : undefined;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          business_name: businessName,
        },
        ...(emailRedirectTo ? { emailRedirectTo } : {}),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#0D0F12] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors duration-300"
    >
      {/* ── 1. Top Navbar Header ───────────────────────────────── */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={platformName}
              style={{ height: `${logoHeight}px` }}
              className="w-auto object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-[4px] bg-[#00A389] flex items-center justify-center text-white text-xs font-black">
                💬
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#00685F] dark:text-[#6BD8CB]">
                {platformName}
              </span>
            </div>
          )}
        </Link>

        {/* Right Controls */}
        <div className="flex items-center gap-4 text-xs">
          <LanguageSwitcher />
          <ModeToggle />
          <div className="hidden sm:flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <span>{isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}</span>
            <Link
              href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : "/login"}
              className="font-bold text-[#00A389] hover:underline"
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Center Card (Split 2-Column Dark Container) ─────── */}
      <main className="max-w-4xl w-full mx-auto my-auto py-6">
        <div className="rounded-2xl bg-[#1C1C1E] dark:bg-[#141416] border border-neutral-800 text-white shadow-2xl p-8 sm:p-12">
          {success ? (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-[#00A389]/20 text-[#00A389] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                {isAr ? "تفقد بريدك الإلكتروني 📩" : "Check Your Email 📩"}
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {isAr
                  ? `تم إرسال رابط تأكيد وتفعيل الحساب إلى ${email}. يرجى الضغط على الرابط لتسجيل الدخول.`
                  : `We've sent a verification link to ${email}. Please check your inbox and click the link to activate your account.`}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full rounded-[4px] bg-[#00A389] hover:bg-[#008f78] text-white py-3 text-xs font-bold uppercase tracking-wider transition-all"
              >
                {isAr ? "الانتقال لتسجيل الدخول" : "Proceed to Sign In"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              {/* Left Column: Feature Checkmarks & Testimonial (~42%) */}
              <div className="md:col-span-5 space-y-8 md:pe-4 md:border-e md:border-neutral-800/80">
                <div className="space-y-6">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug">
                    {isAr ? "ابدأ أتمتة مبيعاتك عبر واتساب اليوم" : "Start Automating Your WhatsApp Sales Today"}
                  </h2>

                  <ul className="space-y-4 text-xs text-neutral-300">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#00A389] shrink-0 mt-0.5" />
                      <span>{isAr ? "ربط فوري عبر رمز QR أو Meta Cloud API" : "Instant setup via QR code or official API"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#00A389] shrink-0 mt-0.5" />
                      <span>{isAr ? "أتمتة استقبال وتوثيق الطلبات بالذكاء الاصطناعي" : "Automate order taking with AI responses"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#00A389] shrink-0 mt-0.5" />
                      <span>{isAr ? "إشعارات وتنبيهات فورية للموظفين عبر تيليجرام" : "Real-time Telegram notifications for staff"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#00A389] shrink-0 mt-0.5" />
                      <span>{isAr ? "تجربة مجانية 14 يوم بدون بطاقة ائتمان" : "14-day free trial. No credit card required."}</span>
                    </li>
                  </ul>
                </div>

                {/* Testimonial Box */}
                <div className="pt-6 border-t border-neutral-800 space-y-2.5">
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {"★★★★★"}
                  </div>
                  <p className="font-serif italic text-xs text-neutral-300 leading-relaxed">
                    {isAr
                      ? `"ضاعفت المنصة سرعة استقبال الطلبات 3 مرات خلال الأسبوع الأول. الذكاء الاصطناعي يجيب على الاستفسارات وفريقنا يركز على التجهيز."`
                      : `"Whatapp Automation increased our order intake by 3x within the first week. The AI handles basic queries while our team focuses on fulfillment."`}
                  </p>
                  <span className="block text-[10px] font-semibold tracking-wider uppercase text-neutral-500">
                    {isAr ? "سارة ج. - مديرة التجارة الإلكترونية" : "SARAH J. - E-COMMERCE DIRECTOR"}
                  </span>
                </div>
              </div>

              {/* Right Column: Registration Form (~58%) */}
              <div className="md:col-span-7 space-y-5">
                <h3 className="font-serif text-xl font-bold text-white">
                  {isAr ? "إنشاء حساب جديد" : "Create Your Account"}
                </h3>

                {/* Google Sign In Button */}
                {googleAuthEnabled && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={googleLoading}
                      className="w-full h-10 rounded-[4px] bg-[#2A2A2D] hover:bg-[#333336] border border-neutral-700/80 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                    >
                      {googleLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                          </svg>
                          <span>{isAr ? "المتابعة عبر Google" : "Continue with Google"}</span>
                        </>
                      )}
                    </button>

                    <div className="relative flex items-center justify-center my-3">
                      <div className="border-t border-neutral-800 w-full" />
                      <span className="bg-[#1C1C1E] dark:bg-[#141416] px-3 text-[11px] text-neutral-500 font-medium">
                        {isAr ? "أو التسجيل عبر البريد الإلكتروني" : "or register with email"}
                      </span>
                    </div>
                  </>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-[4px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    ⚠️ {error}
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSignup} className="space-y-3.5">
                  {/* Row 1: Full Name & Business Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1 text-start">
                      <label className="text-[11px] font-semibold text-neutral-300">
                        {isAr ? "الاسم الكامل" : "Full Name"}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isAr ? "محمد علي" : "Jane Doe"}
                        className="w-full h-10 px-3 rounded-[4px] bg-white text-neutral-900 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00A389]"
                      />
                    </div>

                    <div className="space-y-1 text-start">
                      <label className="text-[11px] font-semibold text-neutral-300">
                        {isAr ? "اسم النشاط التجاري" : "Business Name"}
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={isAr ? "شركة النماء" : "Acme Corp"}
                        className="w-full h-10 px-3 rounded-[4px] bg-white text-neutral-900 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00A389]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Work Email */}
                  <div className="space-y-1 text-start">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      {isAr ? "بريد العمل الإلكتروني" : "Work Email"}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@acme.com"
                      className="w-full h-10 px-3 rounded-[4px] bg-white text-neutral-900 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00A389] dir-ltr text-start"
                    />
                  </div>

                  {/* Row 3: Password */}
                  <div className="space-y-1 text-start">
                    <label className="text-[11px] font-semibold text-neutral-300">
                      {isAr ? "كلمة المرور" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-10 ps-3 pe-10 rounded-[4px] bg-white text-neutral-900 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00A389] dir-ltr text-start"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute end-3 top-2.5 text-neutral-500 hover:text-neutral-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Agree to Terms Checkbox */}
                  <div className="flex items-center gap-2 pt-1 text-start">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-neutral-600 text-[#00A389] focus:ring-[#00A389] cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[11px] text-neutral-400 select-none cursor-pointer">
                      {isAr ? (
                        <>
                          أوافق على{" "}
                          <Link href="/p/terms" className="text-white hover:underline font-medium">
                            شروط الخدمة
                          </Link>{" "}
                          و{" "}
                          <Link href="/p/privacy" className="text-white hover:underline font-medium">
                            سياسة الخصوصية
                          </Link>
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link href="/p/terms" className="text-white hover:underline font-medium">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/p/privacy" className="text-white hover:underline font-medium">
                            Privacy Policy
                          </Link>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-[4px] bg-[#00A389] hover:bg-[#008f78] text-white font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      isAr ? "إنشاء حساب مجاني" : "CREATE FREE ACCOUNT"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── 3. Bottom Trust Badges & Copyright Bar ───────────────── */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/5 dark:border-white/5">
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-[#00A389]" />
            <span>{isAr ? "حماية بيانات 100%" : "100% Data Security"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-[#00A389]" />
            <span>{isAr ? "لا يلزم وجود بطاقة ائتمان" : "No Credit Card Required"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-[#00A389]" />
            <span>{isAr ? "إلغاء في أي وقت" : "Cancel Anytime"}</span>
          </div>
        </div>

        <div>
          {isAr
            ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
            : `All rights reserved © ${new Date().getFullYear()} ${platformName}.`}
        </div>
      </footer>
    </div>
  );
}
