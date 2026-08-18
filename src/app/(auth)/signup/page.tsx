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

  const [platformName, setPlatformName] = useState<string>("MK Whats");
  const [primaryColor, setPrimaryColor] = useState<string>("#7C3AED");
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          if (data.settings.platform_name) setPlatformName(data.settings.platform_name);
          if (data.settings.primary_color) setPrimaryColor(data.settings.primary_color);
          if (data.settings.google_auth_enabled) setGoogleAuthEnabled(true);
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
        <h1 className="text-3xl sm:text-4xl font-black text-[#18181B] tracking-tight">
          Create your account 🚀
        </h1>
        <p className="text-sm text-[#71717A] font-normal leading-relaxed">
          Start using {platformName} today | أنشئ حسابك وابدأ الاستخدام فوراً
        </p>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-600 font-bold leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Full Name Field */}
        <div className="space-y-1">
          <label htmlFor="fullName" className="text-xs font-bold text-[#18181B]">
            Full Name / الاسم الكامل
          </label>
          <div className="relative">
            <User className="absolute start-3.5 top-3.5 h-4 w-4 text-[#71717A]" />
            <Input
              id="fullName"
              type="text"
              placeholder="محمد علي / John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="h-11 ps-10 bg-[#FFFFFF] border-[#E4E4E7] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs text-[#18181B] placeholder:text-[#71717A]/60"
            />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-1">
          <label htmlFor="email" className="text-xs font-bold text-[#18181B]">
            Email Address / البريد الإلكتروني
          </label>
          <div className="relative">
            <Mail className="absolute start-3.5 top-3.5 h-4 w-4 text-[#71717A]" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 ps-10 bg-[#FFFFFF] border-[#E4E4E7] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono text-[#18181B] placeholder:text-[#71717A]/60"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-bold text-[#18181B]">
            Password / كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute start-3.5 top-3.5 h-4 w-4 text-[#71717A]" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 ps-10 pe-10 bg-[#FFFFFF] border-[#E4E4E7] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono text-[#18181B] placeholder:text-[#71717A]/60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3.5 top-3.5 text-[#71717A] hover:text-[#18181B]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Password Strength Indicator UX */}
          <PasswordStrengthIndicator password={password} />
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="text-xs font-bold text-[#18181B]">
            Confirm Password / تأكيد كلمة المرور
          </label>
          <div className="relative">
            <Lock className="absolute start-3.5 top-3.5 h-4 w-4 text-[#71717A]" />
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 ps-10 pe-10 bg-[#FFFFFF] border-[#E4E4E7] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono text-[#18181B] placeholder:text-[#71717A]/60"
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
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E4E4E7]" /></div>
              <span className="relative bg-white px-3 text-[11px] font-bold text-[#71717A]">أو / OR</span>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={googleLoading || loading}
              onClick={handleGoogleAuth}
              className="w-full h-12 rounded-2xl font-bold text-xs text-[#18181B] border-[#E4E4E7] bg-white hover:bg-slate-50 shadow-sm transition-all flex items-center justify-center gap-3"
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#71717A]" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span>إنشاء حساب بواسطة Google / Sign up with Google 🚀</span>
            </Button>
          </div>
        )}

        {/* Switch Link */}
        <div className="text-center text-xs font-bold text-[#71717A] pt-1">
          Already have an account?{" "}
          <Link
            href={
              inviteToken
                ? `/login?invite=${encodeURIComponent(inviteToken)}`
                : "/login"
            }
            className="text-[#7C3AED] hover:underline font-black ms-1"
          >
            Sign In / تسجيل الدخول 🔑
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
