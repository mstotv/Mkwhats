"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}

function getCachedSiteSettings() {
  if (typeof window === "undefined") {
    return { platform_name: "MK Whats", primary_color: "#10b981", google_auth_enabled: true };
  }
  try {
    const cached = localStorage.getItem("mk_site_settings");
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        platform_name: parsed.platform_name || "MK Whats",
        primary_color: parsed.primary_color || "#10b981",
        google_auth_enabled: parsed.google_auth_enabled !== undefined ? !!parsed.google_auth_enabled : true,
      };
    }
  } catch {}
  return { platform_name: "MK Whats", primary_color: "#10b981", google_auth_enabled: true };
}

function SignupPageInner() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const cachedSettings = getCachedSiteSettings();
  const [platformName, setPlatformName] = useState<string>(cachedSettings.platform_name);
  const [primaryColor, setPrimaryColor] = useState<string>(cachedSettings.primary_color);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState<boolean>(cachedSettings.google_auth_enabled);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.platform_name) setPlatformName(data.settings.platform_name);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة / Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل / Password must be at least 6 characters");
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

  if (success) {
    return (
      <AuthShell
        illustrationImage="/signup-illustration.png"
        badgeText="تفعيل الحساب والتحقق"
        illustrationTitle="تفقد بريدك الإلكتروني"
        illustrationSub="تم إرسال رابط التفعيل بنجاح. يرجى فتح البريد الإلكتروني والنقر على الرابط لتأكيد حسابك."
      >
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#18181B]">Check your email 📩</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              We&apos;ve sent a confirmation link to{" "}
              <span className="text-[#7C3AED] font-bold dir-ltr inline-block">{email}</span>. Please check your inbox to verify your account.
            </p>
          </div>
          <Link
            href={
              inviteToken
                ? `/login?invite=${encodeURIComponent(inviteToken)}`
                : "/login"
            }
          >
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-[#E4E4E7] text-[#18181B] font-bold text-xs hover:bg-[#F4F4F5]"
            >
              Sign In / العودة لصفحة تسجيل الدخول
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      illustrationImage="/signup-illustration.png"
      badgeText="إنشاء حساب جديد"
      illustrationTitle="ابدأ رحلتك الرقمية اليوم"
      illustrationSub={`انضم إلى مئات الشركات والمتاجر وابدأ أتمتة مبيعاتك عبر منصة ${platformName}`}
    >
      {/* Titles */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground dark:text-zinc-100 tracking-tight">
          Create your account 🚀
        </h1>
        <p className="text-sm text-muted-foreground dark:text-zinc-400 font-normal leading-relaxed">
          Start using {platformName} today | أنشئ حسابك وابدأ الاستخدام فوراً
        </p>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-1">
          <label htmlFor="fullName" className="text-xs font-bold text-foreground dark:text-zinc-200">
            Full Name / الاسم الكامل
          </label>
          <div className="relative">
            <User className="absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              id="fullName"
              type="text"
              placeholder="محمد علي / John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 ps-10 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 text-foreground dark:text-zinc-100 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
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
              className="h-11 ps-10 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 text-foreground dark:text-zinc-100 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-bold text-foreground dark:text-zinc-200">
            Password / كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 ps-10 pe-10 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 text-foreground dark:text-zinc-100 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono placeholder:text-muted-foreground/60 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3.5 top-3.5 text-muted-foreground hover:text-foreground dark:hover:text-zinc-100 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength Indicator UX */}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-bold text-foreground dark:text-zinc-200">
            Confirm Password / تأكيد كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute start-3.5 top-3.5 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 ps-10 pe-10 bg-white dark:bg-zinc-900/90 border-slate-200 dark:border-zinc-800 text-foreground dark:text-zinc-100 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono placeholder:text-muted-foreground/60 transition-colors"
            />
          </div>
        </div>

        {/* Create Account Submit Button */}
        <Button
          type="submit"
          disabled={loading || googleLoading}
          style={{ backgroundColor: primaryColor }}
          className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl shadow-[#7C3AED]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account... / جاري الإنشاء...
            </>
          ) : (
            <>
              Create Account / إنشاء الحساب <ArrowLeft className="h-4 w-4 ms-1" />
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
              <span>إنشاء حساب بواسطة Google / Sign up with Google 🚀</span>
            </button>
          </div>
        )}

        {/* Switch Link */}
        <div className="text-center text-xs font-bold text-muted-foreground dark:text-zinc-400 pt-1">
          Already have an account?{" "}
          <Link
            href={
              inviteToken
                ? `/login?invite=${encodeURIComponent(inviteToken)}`
                : "/login"
            }
            className="text-[#7C3AED] dark:text-purple-400 hover:underline font-black ms-1"
          >
            Sign In / تسجيل الدخول 🔑
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
