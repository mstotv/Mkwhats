"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2, Lock, Zap } from "lucide-react";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export interface AuthInitialSettings {
  platformName: string;
  logoUrl: string;
  logoHeight: number;
  googleAuthEnabled: boolean;
}

export function LoginPageClient({ initialSettings }: { initialSettings: AuthInitialSettings }) {
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

  const platformName = initialSettings.platformName;
  const logoUrl = initialSettings.logoUrl;
  const logoHeight = initialSettings.logoHeight || 32;
  const googleAuthEnabled = initialSettings.googleAuthEnabled;
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

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
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#0D0F12] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans flex flex-col justify-between relative overflow-hidden transition-colors duration-300"
    >
      {/* Top & Center Ambient Mesh Glows behind Frosted Glass Card */}
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
          {!inviteToken && (
            <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground">
              <span>{isAr ? "ليس لديك حساب؟" : "Don't have an account?"}</span>
              <Link href="/signup" className="font-bold text-[#00A389] dark:text-[#6BD8CB] hover:underline">
                {isAr ? "إنشاء حساب مجاني" : "Sign Up Free"}
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Center Frosted Glass Auth Card Container ─────────── */}
      <main className="max-w-md w-full mx-auto px-4 py-8 relative z-10 flex flex-col items-center">
        {/* The Raycast-grade Frosted Glass Card */}
        <div className="w-full raycast-navbar-glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-black/10 dark:border-white/10 relative">
          
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {isAr ? "مرحباً بعودتك" : "Welcome Back"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "سجّل الدخول لإدارة بوتات الواتساب، والبرودكاست، والطلبات الواردة."
                : "Log in to manage your WhatsApp bots, live broadcasts, and incoming orders."}
            </p>
          </div>

          {/* Google Sign In Button */}
          {googleAuthEnabled && (
            <div className="mb-5 space-y-4">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={googleLoading || loading}
                className="w-full h-11 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] border border-black/10 dark:border-white/10 font-medium text-xs text-foreground transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
              >
                {googleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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
                    <span>{isAr ? "متابعة باستخدام حساب Google" : "Continue with Google"}</span>
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-black/10 dark:border-white/10 w-full" />
                <span className="bg-background/80 dark:bg-zinc-900/80 backdrop-blur-md px-3 text-[11px] text-muted-foreground uppercase tracking-wider absolute">
                  {isAr ? "أو بالبريد الإلكتروني" : "Or with email"}
                </span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {displayError && (
              <div className="p-3 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-center font-medium">
                {displayError}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5 text-start">
              <label className="text-xs font-semibold text-foreground">
                {isAr ? "البريد الإلكتروني أو رقم الهاتف" : "Email or Phone Number"}
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAr ? "name@company.com" : "name@company.com"}
                className="w-full h-11 px-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#00A389]/40 focus:border-[#00A389] transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 text-start">
              <label className="text-xs font-semibold text-foreground">
                {isAr ? "كلمة المرور" : "Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 pe-10 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/10 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#00A389]/40 focus:border-[#00A389] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-muted-foreground hover:text-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-black/20 dark:border-white/20 text-[#00A389] focus:ring-[#00A389] accent-[#00A389]"
                />
                <span>{isAr ? "تذكرني دائماً" : "Remember me"}</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-[#00A389] dark:text-[#6BD8CB] hover:underline font-semibold"
              >
                {isAr ? "نسيت كلمة المرور؟" : "Forgot Password?"}
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-4 uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99]"
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
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-6 text-[11px] text-muted-foreground">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-md px-3.5 py-1.5 shadow-xs">
            <Lock className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>{isAr ? "جلسة مشفرة بالكامل من طرف لطرف" : "End-to-End Encrypted Session"}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 backdrop-blur-md px-3.5 py-1.5 shadow-xs">
            <Zap className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>{isAr ? "متصل مع Meta Cloud API الرسمية" : "Connected to Meta Cloud API"}</span>
          </div>
        </div>
      </main>

      {/* ── 3. Dark Editorial Bottom Footer ─────────────────────── */}
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
            <Link href="/p/security" className="hover:text-foreground transition-colors">
              {isAr ? "الأمان والحماية" : "Security"}
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
