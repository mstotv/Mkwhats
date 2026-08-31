"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Lock, Zap } from "lucide-react";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
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

function LoginPageInner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  const displayError =
    error ||
    (errorParam === "account_suspended"
      ? (isAr ? "هذا الحساب معلّق حالياً، يرجى التواصل مع الدعم" : "This account is currently suspended. Please contact support.")
      : null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const destination = inviteToken
      ? `/join/${encodeURIComponent(inviteToken)}`
      : "/dashboard";
    window.location.href = destination;
  };

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
          {!inviteToken && (
            <div className="hidden sm:flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
              <span>{isAr ? "ليس لديك حساب؟" : "Don't have an account?"}</span>
              <Link href="/signup" className="font-bold text-[#00A389] hover:underline">
                {isAr ? "إنشاء حساب مجاني" : "Sign Up Free"}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Center Card (Dark Container on Warm Beige) ───────── */}
      <main className="max-w-md w-full mx-auto my-auto px-4 py-8">
        <div className="rounded-2xl bg-[#1C1C1E] dark:bg-[#141416] border border-neutral-800 text-white shadow-2xl p-8 sm:p-10 text-center">
          {/* Header Title & Subtitle */}
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold text-white tracking-tight">
              {inviteToken ? (isAr ? "الانضمام لفريقك 👋" : "Join Your Team") : (isAr ? "مرحباً بعودتك" : "Welcome Back")}
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
              {inviteToken
                ? (isAr ? "سجّل دخولك لتفعيل دعوتك والانضمام المباشر لبيئة العمل" : "Sign in to activate your invitation and join the workspace.")
                : (isAr ? "سجل الدخول لإدارة بوتات الواتساب، حملات البرودكاست، والطلبات الواردة." : "Log in to manage your WhatsApp bots, live broadcasts, and incoming orders.")}
            </p>
          </div>

          {/* Google Sign In Button */}
          {googleAuthEnabled && (
            <>
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full h-10 rounded-[4px] bg-[#2A2A2D] hover:bg-[#333336] border border-neutral-700/80 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer mt-6"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                ) : (
                  <>
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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

              <div className="relative flex items-center justify-center my-4">
                <div className="border-t border-neutral-800 w-full" />
                <span className="bg-[#1C1C1E] dark:bg-[#141416] px-3 text-[10px] uppercase font-bold text-neutral-500">
                  {isAr ? "أو" : "OR"}
                </span>
              </div>
            </>
          )}

          {/* Error Message */}
          {displayError && (
            <div className="p-3 mb-4 rounded-[4px] bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold text-start">
              ⚠️ {displayError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-start">
            {/* Email / Phone Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-neutral-300">
                {isAr ? "البريد الإلكتروني أو رقم الهاتف" : "Email or Phone Number"}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-10 px-3 rounded-[4px] bg-[#242426] text-white border border-neutral-700/80 text-xs font-medium placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#00A389] dir-ltr text-start"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1">
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

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-2 text-neutral-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-neutral-600 text-[#00A389] focus:ring-[#00A389] cursor-pointer"
                />
                <span>{isAr ? "تذكرني" : "Remember me"}</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[#00A389] hover:underline font-semibold"
              >
                {isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 rounded-[4px] bg-[#00A389] hover:bg-[#008f78] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 uppercase tracking-wider"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                isAr ? "الدخول للوحة التحكم" : "Sign In to Dashboard"
              )}
            </button>
          </form>
        </div>

        {/* Security & API Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-6 text-[11px] text-neutral-600 dark:text-neutral-400">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 border border-neutral-300/50 dark:border-neutral-700/50 px-3.5 py-1 shadow-sm">
            <Lock className="h-3 w-3 text-[#00A389]" />
            <span>{isAr ? "جلسة مشفرة بالكامل من طرف لطرف" : "End-to-End Encrypted Session"}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 border border-neutral-300/50 dark:border-neutral-700/50 px-3.5 py-1 shadow-sm">
            <Zap className="h-3 w-3 text-[#00A389]" />
            <span>{isAr ? "متصل مع Meta Cloud API الرسمية" : "Connected to Meta Cloud API"}</span>
          </div>
        </div>
      </main>

      {/* ── 3. Dark Editorial Bottom Footer ─────────────────────── */}
      <footer className="w-full bg-[#1A1A1A] border-t border-neutral-800 py-6 text-xs text-neutral-400">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-base font-bold text-white tracking-tight">
            {platformName}
          </span>

          <div className="flex items-center gap-6 text-xs text-neutral-400">
            <Link href="/p/privacy" className="hover:text-white transition-colors">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link href="/p/terms" className="hover:text-white transition-colors">
              {isAr ? "شروط الخدمة" : "Terms of Service"}
            </Link>
            <Link href="/p/security" className="hover:text-white transition-colors">
              {isAr ? "الأمان والحماية" : "Security"}
            </Link>
          </div>

          <div className="text-[11px] text-neutral-500">
            {isAr
              ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
              : `© ${new Date().getFullYear()} ${platformName}. All rights reserved.`}
          </div>
        </div>
      </footer>
    </div>
  );
}
