"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Key, Mail, CheckCircle2, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export interface ForgotPasswordInitialSettings {
  platformName: string;
  logoUrl: string;
  logoHeight: number;
  supportWhatsapp: string;
}

export function ForgotPasswordClient({ initialSettings }: { initialSettings: ForgotPasswordInitialSettings }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const platformName = initialSettings.platformName;
  const logoUrl = initialSettings.logoUrl;
  const logoHeight = initialSettings.logoHeight || 32;
  const supportWhatsapp = initialSettings.supportWhatsapp;

  const supabase = createClient();

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
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#0D0F12] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans flex flex-col justify-between relative overflow-hidden transition-colors duration-300"
    >
      {/* Top & Center Ambient Mesh Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] max-w-[95vw] h-[550px] bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent blur-[130px] pointer-events-none -z-0" />
      <div className="absolute -top-24 left-1/4 w-[400px] h-[300px] bg-emerald-500/15 dark:bg-emerald-500/25 blur-[100px] pointer-events-none -z-0" />
      <div className="absolute -top-24 right-1/4 w-[400px] h-[300px] bg-teal-500/15 dark:bg-teal-500/25 blur-[100px] pointer-events-none -z-0" />

      {/* ── 1. Top Navbar Header ───────────────────────────────── */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between p-4 sm:p-6 lg:p-8 py-4 relative z-10">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={platformName}
              style={{ height: `${logoHeight}px` }}
              className="w-auto object-contain max-h-10"
            />
          ) : (
            <span className="font-serif text-xl font-bold tracking-tight text-[#00685F] dark:text-[#6BD8CB]">
              {platformName}
            </span>
          )}
        </Link>

        {/* Right Controls */}
        <div className="flex items-center gap-4 text-xs">
          <LanguageSwitcher />
          <ModeToggle />
          <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
            <span>{isAr ? "تتذكر كلمة المرور؟" : "Remember password?"}</span>
            <Link href="/login" className="font-bold text-[#00A389] dark:text-[#6BD8CB] hover:underline">
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Center Card (Frosted Glass Container) ───────────── */}
      <main className="max-w-md w-full mx-auto my-auto px-4 py-8 relative z-10">
        <div className="rounded-3xl raycast-navbar-glass p-8 sm:p-10 text-center relative overflow-hidden">
          {/* Top Key Icon Box */}
          <div className="h-12 w-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/10 dark:border-white/10 flex items-center justify-center mx-auto text-emerald-500 shadow-sm">
            <Key className="h-5 w-5" strokeWidth={1.5} />
          </div>

          {/* Header Title & Subtitle */}
          <div className="space-y-2 mt-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {isAr ? "إعادة تعيين كلمة المرور" : "Reset Your Password"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {isAr
                ? "أدخل بريدك الإلكتروني المسجل أدناه، وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور."
                : "Enter your registered email address below, and we'll send you a secure password reset link."}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 my-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold text-start">
              ⚠️ {error}
            </div>
          )}

          {success ? (
            <div className="py-6 space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-[#00A389]/20 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed">
                {isAr
                  ? `تم إرسال رابط إعادة التعيين بنجاح إلى ${email}. تفقد بريدك الإلكتروني.`
                  : `We've sent a password reset link to ${email}. Please check your inbox.`}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full rounded-xl bg-foreground text-background hover:bg-foreground/90 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                {isAr ? "العودة لتسجيل الدخول" : "Back to Sign In"}
              </Link>
            </div>
          ) : (
            /* Reset Form */
            <form onSubmit={handleReset} className="space-y-4 text-start mt-6">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  {isAr ? "بريد العمل أو الحساب الإلكتروني" : "Work or Account Email Address"}
                </label>
                <div className="relative">
                  <Mail className="absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" strokeWidth={1.5} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full h-11 ps-10 pe-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground border border-black/10 dark:border-white/10 text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 dir-ltr text-start transition-all"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/80 pt-0.5">
                  {isAr
                    ? `تأكد من أن هذا هو البريد المرتبط بحسابك في ${platformName}.`
                    : `Make sure this is the email associated with your ${platformName} account.`}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4 uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>{isAr ? "إرسال رابط إعادة التعيين" : "Send Password Reset Link"}</span>
                    <ArrowIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>

              {/* Divider & Back Link */}
              <div className="pt-3 text-center border-t border-black/10 dark:border-white/10">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isAr ? "← العودة لتسجيل الدخول" : "← Back to Login"}
                </Link>

                <p className="text-[10px] text-muted-foreground/80 mt-3">
                  {isAr ? (
                    <>
                      لم يصلك البريد؟ تفقد مجلد الرسائل غير المرغوب فيها أو{" "}
                      {supportWhatsapp ? (
                        <a href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#00A389] dark:text-[#6BD8CB] hover:underline font-semibold">
                          تواصل مع الدعم
                        </a>
                      ) : (
                        <Link href="/faq" className="text-[#00A389] dark:text-[#6BD8CB] hover:underline font-semibold">
                          تواصل مع الدعم
                        </Link>
                      )}
                      .
                    </>
                  ) : (
                    <>
                      Didn&apos;t receive the email? Check your spam folder or{" "}
                      {supportWhatsapp ? (
                        <a href={`https://wa.me/${supportWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-[#00A389] dark:text-[#6BD8CB] hover:underline font-semibold">
                          contact support
                        </a>
                      ) : (
                        <Link href="/faq" className="text-[#00A389] dark:text-[#6BD8CB] hover:underline font-semibold">
                          contact support
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

      {/* ── 3. Bottom Trust Bar ──────────────────────────────────── */}
      <footer className="w-full border-t border-black/5 dark:border-white/5 py-6 text-xs text-muted-foreground relative z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-bold text-foreground tracking-tight">
            {platformName}
          </span>

          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/p/privacy" className="hover:text-foreground transition-colors">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link href="/p/terms" className="hover:text-foreground transition-colors">
              {isAr ? "شروط الخدمة" : "Terms of Service"}
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">
              {isAr ? "الأسئلة الشائعة" : "FAQ"}
            </Link>
          </div>

          <div className="text-[11px] text-muted-foreground">
            {isAr
              ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
              : `© ${new Date().getFullYear()} ${platformName}. All rights reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
}
