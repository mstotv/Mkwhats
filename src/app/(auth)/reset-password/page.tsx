"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Key, Lock, Eye, EyeOff, CheckCircle2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
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
      };
    }
  } catch {}
  return { platform_name: "WhatsApp Automation", primary_color: "#00A389" };
}

function ResetPasswordInner() {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cachedSettings = getCachedSiteSettings();
  const [platformName, setPlatformName] = useState<string>(cachedSettings.platform_name);
  const [logoUrl, setLogoUrl] = useState<string>(cachedSettings.logo_url || "");
  const [logoHeight, setLogoHeight] = useState<number>(cachedSettings.logo_height || 32);

  const supabase = createClient();

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.platform_name) setPlatformName(isAr ? (data.settings.platform_name_ar || data.settings.platform_name) : (data.settings.platform_name_en || data.settings.platform_name));
          if (data.settings.logo_url) setLogoUrl(data.settings.logo_url);
          if (data.settings.logo_height) setLogoHeight(data.settings.logo_height);
          try { localStorage.setItem("mk_site_settings", JSON.stringify(data.settings)); } catch {}
        }
      })
      .catch(() => {});
  }, [isAr]);

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
          <Link href="/login" className="font-bold text-[#00A389] hover:underline">
            {isAr ? "تسجيل الدخول" : "Sign In"}
          </Link>
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
              {isAr ? "تعيين كلمة المرور الجديدة" : "Set New Password"}
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              {isAr
                ? "أدخل كلمة المرور الجديدة لحسابك لتأمين وصولك إلى لوحة التحكم."
                : "Enter a new secure password for your account to restore dashboard access."}
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
                  ? "تم تحديث كلمة المرور بنجاح! جاري تحويلك إلى لوحة التحكم..."
                  : "Password updated successfully! Redirecting to dashboard..."}
              </p>
            </div>
          ) : (
            /* Update Form */
            <form onSubmit={handleUpdatePassword} className="space-y-4 text-start mt-6">
              {/* New Password Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  {isAr ? "كلمة المرور الجديدة" : "New Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 ps-3 pe-10 rounded-[4px] bg-[#242426] text-white border border-neutral-700/80 text-xs font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00A389] dir-ltr text-start"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute end-3 top-2.5 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  {isAr ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 ps-3 pe-3 rounded-[4px] bg-[#242426] text-white border border-neutral-700/80 text-xs font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00A389] dir-ltr text-start"
                />
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
                    <span>{isAr ? "حفظ كلمة المرور الجديدة" : "Update Password & Sign In"}</span>
                    <ArrowIcon className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              <div className="pt-3 text-center border-t border-neutral-800">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
                >
                  {isAr ? "← إلغاء والعودة لتسجيل الدخول" : "← Cancel and Back to Login"}
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* ── 3. Bottom Footer Bar ─────────────────────────────────── */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 lg:p-8 py-4 text-[11px] text-neutral-500 dark:text-neutral-400 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5 text-[#00A389]" />
          <span>{isAr ? "جلسة مشفرة وآمنة" : "Encrypted & Secure Reset Session"}</span>
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
