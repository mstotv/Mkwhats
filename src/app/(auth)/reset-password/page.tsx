"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordStrengthIndicator } from "@/components/auth/password-strength-indicator";
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
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
  };

  if (success) {
    return (
      <AuthShell
        illustrationImage="/login-illustration.png"
        badgeText="تم التحديث بنجاح"
        illustrationTitle="تحديث كلمة المرور"
        illustrationSub="تم تحديث كلمة المرور الخاصة بحسابك بنجاح. يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة."
      >
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-[#18181B]">Password updated! 🎉</h2>
            <p className="text-xs text-[#71717A] leading-relaxed">
              Your password has been reset successfully | تم تحديث كلمة المرور بنجاح.
            </p>
          </div>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl border-[#E4E4E7] text-[#18181B] font-bold text-xs hover:bg-[#F4F4F5]"
            >
              Sign In / تسجيل الدخول الآن 🚀
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      illustrationImage="/login-illustration.png"
      badgeText="تعيين كلمة مرور جديدة"
      illustrationTitle="تعيين كلمة المرور الجديدة"
      illustrationSub="أدخل كلمة المرور الجديدة لحماية حسابك وتأكيد عملية إعادة التعيين."
    >
      {/* Titles */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-[#18181B] tracking-tight">
          Reset Password 🔐
        </h1>
        <p className="text-sm text-[#71717A] font-normal leading-relaxed">
          Enter your new password below | أدخل كلمة المرور الجديدة أدناه
        </p>
      </div>

      {/* Error Message Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-600 font-bold leading-relaxed">
          ⚠️ {error}
        </div>
      )}

      {/* Form Controls */}
      <form onSubmit={handleUpdatePassword} className="space-y-4">
        {/* New Password Field */}
        <div className="space-y-1">
          <label htmlFor="password" className="text-xs font-bold text-[#18181B]">
            New Password / كلمة المرور الجديدة
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
            Confirm New Password / تأكيد كلمة المرور الجديدة
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

        {/* Update Password Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          style={{ backgroundColor: primaryColor }}
          className="w-full h-12 rounded-2xl font-black text-sm text-white shadow-xl shadow-[#7C3AED]/20 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating password... / جاري التحديث...
            </>
          ) : (
            <>
              Update Password / تحديث كلمة المرور <ArrowLeft className="h-4 w-4 ms-1" />
            </>
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
