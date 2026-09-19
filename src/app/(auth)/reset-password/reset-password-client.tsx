"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Key, Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export interface ResetPasswordInitialSettings {
  platformName: string;
  logoUrl: string;
  logoHeight: number;
}

export function ResetPasswordClient({ initialSettings }: { initialSettings: ResetPasswordInitialSettings }) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const platformName = initialSettings.platformName;
  const logoUrl = initialSettings.logoUrl;
  const logoHeight = initialSettings.logoHeight || 32;

  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError(isAr ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
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
          <Link href="/login" className="font-bold text-[#00A389] dark:text-[#6BD8CB] hover:underline">
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </Link>
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
              {isAr ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              {isAr
                ? "أدخل كلمة المرور الجديدة لحسابك لتأمين وصولك إلى لوحة التحكم."
                : "Enter a new secure password for your account to restore dashboard access."}
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
                  ? "تم تحديث كلمة المرور بنجاح! جاري تحويلك إلى لوحة التحكم..."
                  : "Password updated successfully! Redirecting to dashboard..."}
              </p>
            </div>
          ) : (
            /* Update Form */
            <form onSubmit={handleUpdatePassword} className="space-y-4 text-start mt-6">
              {/* New Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  {isAr ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 ps-3.5 pe-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground border border-black/10 dark:border-white/10 text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 dir-ltr text-start transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4" strokeWidth={1.5} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 ps-3.5 pe-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground border border-black/10 dark:border-white/10 text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 dir-ltr text-start transition-all"
                />
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
                    <span>{isAr ? "حفظ كلمة المرور الجديدة" : "Update Password & Sign In"}</span>
                    <ArrowIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>

              <div className="pt-3 text-center border-t border-black/10 dark:border-white/10">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isAr ? "← إلغاء والعودة لتسجيل الدخول" : "← Cancel and Back to Login"}
                </Link>
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
