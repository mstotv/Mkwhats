"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function getCachedSiteSettings() {
  if (typeof window === "undefined") {
    return { primary_color: "#10b981", google_auth_enabled: true };
  }
  try {
    const cached = localStorage.getItem("mk_site_settings");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        primary_color: parsed.primary_color || "#10b981",
        google_auth_enabled: parsed.google_auth_enabled !== undefined ? !!parsed.google_auth_enabled : true,
      };
    }
  } catch {}
  return { primary_color: "#10b981", google_auth_enabled: true };
}

function LoginPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const errorParam = searchParams.get("error");
  const t = useTranslations("LoginPage");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cachedSettings = getCachedSiteSettings();
  const [primaryColor, setPrimaryColor] = useState<string>(cachedSettings.primary_color);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState<boolean>(cachedSettings.google_auth_enabled);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.primary_color) setPrimaryColor(data.settings.primary_color);
          if (data.settings.google_auth_enabled !== undefined) setGoogleAuthEnabled(!!data.settings.google_auth_enabled);
          try { localStorage.setItem('mk_site_settings', JSON.stringify(data.settings)); } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback${inviteToken ? `?next=/join/${encodeURIComponent(inviteToken)}` : ''}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'فشل الاتصال بـ Google');
      setGoogleLoading(false);
    }
  };

  const displayError =
    error ||
    (errorParam === "account_suspended"
      ? "هذا الحساب معلّق حالياً، يرجى التواصل مع الدعم"
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
    <AuthShell
      illustrationImage="/login-illustration.png"
      badgeText="توثيق حسابات وتطبيقات SaaS"
      illustrationTitle="تسجيل دخول آمن ومباشر"
      illustrationSub="إمكانية الوصول الآمن والسريع إلى لوحة التحكم وأتمتة مبيعاتك وحساباتك على مدار الساعة."
    >
      {/* Titles */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-zinc-100 tracking-tight">
          {inviteToken ? "الانضمام لفريقك 👋" : "Welcome Back 👋"}
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400 font-normal leading-relaxed">
          {inviteToken
            ? "سجّل دخولك لتفعيل دعوتك والانضمام المباشر لبيئة العمل"
            : "Sign in to your account to continue | سجّل دخولك للوصول إلى حسابك"}
        </p>
      </div>

      {/* Error Message Banner */}
      {displayError && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
          ⚠️ {displayError}
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold text-foreground dark:text-zinc-200">
            Email Address / البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 ps-10 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 text-foreground dark:text-zinc-100 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold text-foreground dark:text-zinc-200">
              Password / كلمة المرور
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#7C3AED] dark:text-purple-400 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 ps-10 pe-10 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 text-foreground dark:text-zinc-100 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono placeholder:text-muted-foreground/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3.5 top-3.5 text-muted-foreground hover:text-foreground dark:hover:text-zinc-100 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between text-xs font-medium pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-foreground dark:text-zinc-200">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-zinc-700 text-[#7C3AED] focus:ring-[#7C3AED] dark:bg-zinc-900"
            />
            Remember me / تذكرني على هذا الجهاز
          </label>
        </div>

        {/* Main Sign In Button */}
        <Button
          type="submit"
          disabled={loading || googleLoading}
          style={{ backgroundColor: primaryColor }}
          className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl shadow-[#7C3AED]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in... / جاري الدخول...
            </>
          ) : (
            <>
              Sign In / تسجيل الدخول <ArrowLeft className="h-4 w-4 ms-1" />
            </>
          )}
        </Button>

        {/* Google OAuth Button */}
        {googleAuthEnabled && (
          <div className="space-y-3 pt-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-zinc-800" /></div>
              <span className="relative bg-background dark:bg-zinc-950 px-3 text-[11px] font-bold text-muted-foreground dark:text-zinc-400">أو / OR</span>
            </div>

            <button
              type="button"
              disabled={googleLoading || loading}
              onClick={handleGoogleAuth}
              className="w-full h-12 rounded-2xl font-bold text-xs text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>المتابعة بواسطة Google / Continue with Google 🚀</span>
            </button>
          </div>
        )}

        {/* Switch Link */}
        {!inviteToken && (
          <div className="text-center text-xs font-bold text-muted-foreground dark:text-zinc-400 pt-2">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#7C3AED] dark:text-purple-400 hover:underline font-black ms-1">
              Create Account / أنشئ حساباً مجانياً 🚀
            </Link>
          </div>
        )}
      </form>
    </AuthShell>
  );
}
