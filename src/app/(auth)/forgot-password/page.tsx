"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Key, Mail, CheckCircle2, ArrowLeft, ArrowRight, Loader2, Lock } from "lucide-react";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function getCachedSiteSettings() {
  if (typeof window === "undefined") {
    return { platform_name: "WhatsApp Automation", primary_color: "#00A389" };
  }
  try {
    const cached = localStorage.getItem("mk_site_settings");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        platform_name: parsed.platform_name || parsed.platform_name_en || "WhatsApp Automation",
        platform_name_ar: parsed.platform_name_ar || "واتساب أوتوميشن",
        platform_name_en: parsed.platform_name_en || "WhatsApp Automation",
        logo_url: parsed.logo_url || "",
        logo_height: parsed.logo_height || 32,
        primary_color: parsed.primary_color || "#00A389",
        support_whatsapp: parsed.support_whatsapp || "",
      };
    }
  } catch {}
  return { platform_name: "WhatsApp Automation", primary_color: "#00A389" };
}

function ForgotPasswordInner() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cachedSettings = getCachedSiteSettings();
  const [platformName, setPlatformName] = useState<string>(cachedSettings.platform_name);
  const [logoUrl, setLogoUrl] = useState<string>(cachedSettings.logo_url || "");
  const [logoHeight, setLogoHeight] = useState<number>(cachedSettings.logo_height || 32);
  const [supportWhatsapp, setSupportWhatsapp] = useState<string>(cachedSettings.support_whatsapp || "");

  const supabase = createClient();

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.platform_name) setPlatformName(isAr ? (data.settings.platform_name_ar || data.settings.platform_name) : (data.settings.platform_name_en || data.settings.platform_name));
          if (data.settings.logo_url) setLogoUrl(data.settings.logo_url);
          if (data.settings.logo_height) setLogoHeight(data.settings.logo_height);
          if (data.settings.support_whatsapp) setSupportWhatsapp(data.settings.support_whatsapp);
          try { localStorage.setItem("mk_site_settings", JSON.stringify(data.settings)); } catch {}
        }
      })
      .catch(() => {});
  }, [isAr]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#0D0F12] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans flex flex-col justify-between transition-colors duration-300"
    >
      {/* ── 1. Top Navbar Header ───────────────────────────────── */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between p-4 sm:p-6 lg:p-8 py-4">
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
            <span>{isAr ? "تتذكر كلمة المرور؟" : "Remember password?"}</span>
            <Link href="/login" className="font-bold text-[#00A389] hover:underline">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Center Card (Dark Container on Warm Beige) ───────── */}
      <main className="max-w-md w-full mx-auto my-auto px-4 py-8">
        <div className="rounded-2xl bg-[#1C1C1E] dark:bg-[#141416] border border-neutral-800 text-white shadow-2xl p-8 sm:p-10 text-center">
          {/* Top Key Icon Box */}
          <div className="h-12 w-12 rounded-xl bg-[#2A2A2D] border border-neutral-700/80 flex items-center justify-center mx-auto text-[#00A389]">
            <Key className="h-5 w-5" />
          </div>

          {/* Header Title & Subtitle */}
          <div className="space-y-2 mt-5">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isAr ? "إعادة تعيين كلمة المرور" : "Reset Your Password"}
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              {isAr
                ? "أدخل بريدك الإلكتروني المسجل أدناه، وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور."
                : "Enter your registered email address below, and we'll send you a secure password reset link."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 my-4 rounded-[4px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-start">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="py-6 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-[#00A389]/20 text-[#00A389] flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {isAr
                  ? `تم إرسال رابط إعادة التعيين بنجاح إلى ${email}. تفقد بريدك الإلكتروني.`
                  : `We've sent a password reset link to ${email}. Please check your inbox.`}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full rounded-[4px] bg-[#00A389] hover:bg-[#008f78] text-white py-3 text-xs font-bold uppercase tracking-wider transition-all"
              >
                {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
              </Link>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleReset} className="space-y-4 text-start mt-6">
              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  {isAr ? "بريد العمل أو الحساب الإلكتروني" : "Work or Account Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-10 ps-9 pe-3 rounded-[4px] bg-white text-neutral-900 text-xs font-medium placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#00A389] dir-ltr text-start"
                  />
                </div>
                <p className="text-[10px] text-neutral-500 pt-0.5">
                  {isAr
                    ? `تأكد من أن هذا هو البريد المرتبط بحسابك في ${platformName}.`
                    : `Make sure this is the email associated with your ${platformName} account.`}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-[4px] bg-[#00A389] hover:bg-[#008f78] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4 uppercase tracking-wider"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{isAr ? "إرسال رابط إعادة التعيين" : "Send Password Reset Link"}</span>
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              {/* Divider & Back Link */}
              <div className="pt-3 text-center border-t border-neutral-800">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  {isAr ? "← العودة لتسجيل الدخول" : "← Back to Login"}
                </Link>

                <p className="text-[10px] text-neutral-500 mt-3">
                  {isAr ? (
                    <>
                      لم يصلك البريد؟ تفقد مجلد الرسائل غير المرغوب فيها أو{" "}
                      {supportWhatsapp ? (
                        <a href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#00A389] hover:underline font-semibold">
                          تواصل مع الدعم
                        </a>
                      ) : (
                        <Link href="/faq" className="text-[#00A389] hover:underline font-semibold">
                          تواصل مع الدعم
                        </Link>
                      )}
                      .
                    </>
                  ) : (
                    <>
                      Didn&apos;t receive the email? Check your spam folder or{" "}
                      {supportWhatsapp ? (
                        <a href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#00A389] hover:underline font-semibold">
                          Contact Support
                        </a>
                      ) : (
                        <Link href="/faq" className="text-[#00A389] hover:underline font-semibold">
                          Contact Support
                        </Link>
                      )}
                      .
                    </>
                  )}
                </p>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* ── 3. Bottom Encrypted Link & Copyright Bar ────────────── */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 lg:p-8 py-4 text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#00A389]" />
          <span>{isAr ? "رابط مشفر وآمن بالكامل" : "End-to-End Encrypted & Secure Link"}</span>
        </div>

        <div>
          {isAr
            ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
            : `© ${new Date().getFullYear()} ${platformName}. All rights reserved.`}
        </div>
      </footer>
    </div>
  );
}
