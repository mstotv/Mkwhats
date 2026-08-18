"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { Mail, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<string>("#7C3AED");

  const supabase = createClient();

  useEffect(() => {
    fetch('/api/site-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.primary_color) {
          setPrimaryColor(data.settings.primary_color);
        }
      })
      .catch(() => {});
  }, []);

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

  if (success) {
    return (
      <AuthShell
        illustrationImage="/login-illustration.png"
        badgeText="إعادة تعيين كلمة المرور"
        illustrationTitle="رابط استعادة كلمة المرور"
        illustrationSub="تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني المدخل بنجاح."
      >
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#18181B]">Check your email 📩</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              We&apos;ve sent a password reset link to{" "}
              <span className="text-[#7C3AED] font-bold dir-ltr inline-block">{email}</span>. Please check your inbox.
            </p>
          </div>
          <Link href="/login">
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
      illustrationImage="/login-illustration.png"
      badgeText="استعادة كلمة المرور"
      illustrationTitle="استعادة وصول حسابك بآمان"
      illustrationSub="أدخل البريد الإلكتروني المسجل وسنرسل لك رابطاً مشفراً لإعادة تعيين كلمة المرور في ثوانٍ."
    >
      {/* Titles */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#18181B] tracking-tight">
          Forgot Password? 🔑
        </h1>
        <p className="text-sm text-[#71717A] font-normal leading-relaxed">
          Enter your email address to receive a reset link | أدخل بريدك لإرسال رابط الاستعادة
        </p>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-600 font-bold leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleReset} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5">
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
              className="h-12 ps-10 bg-[#FFFFFF] border-[#E4E4E7] focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] rounded-2xl text-xs dir-ltr font-mono text-[#18181B] placeholder:text-[#71717A]/60"
            />
          </div>
        </div>

        {/* Reset Button */}
        <Button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: primaryColor }}
          className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl shadow-[#7C3AED]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending reset link... / جاري الإرسال...
            </>
          ) : (
            <>
              Send Reset Link / إرسال رابط إعادة التعيين <ArrowLeft className="h-4 w-4 ms-1" />
            </>
          )}
        </Button>

        {/* Switch Link */}
        <div className="text-center text-xs font-bold text-[#71717A] pt-2">
          Remember your password?{" "}
          <Link href="/login" className="text-[#7C3AED] hover:underline font-black ms-1">
            Sign In / تسجيل الدخول 🔑
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
