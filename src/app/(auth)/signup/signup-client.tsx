"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, CreditCard, XCircle } from "lucide-react";
import { useLocale } from "next-intl";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { AuthInitialSettings } from "../login/login-client";

export function SignupPageClient({ initialSettings }: { initialSettings: AuthInitialSettings }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError(isAr ? "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية" : "You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    if (password.length < 6) {
      setError(isAr ? "يجب أن تكون كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters");
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
          business_name: businessName,
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

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="min-h-screen bg-[#F9F5F0] dark:bg-[#0D0F12] text-[#1B1C1C] dark:text-[#F2F0F0] font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden transition-colors duration-300"
    >
      {/* Top & Center Ambient Mesh Glows behind Frosted Glass Card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] max-w-[95vw] h-[600px] bg-gradient-to-tr from-emerald-500/25 via-teal-500/15 to-transparent blur-[130px] pointer-events-none -z-0" />
      <div className="absolute -top-24 left-1/4 w-[400px] h-[300px] bg-emerald-500/15 dark:bg-emerald-500/25 blur-[100px] pointer-events-none -z-0" />
      <div className="absolute -top-24 right-1/4 w-[400px] h-[300px] bg-teal-500/15 dark:bg-teal-500/25 blur-[100px] pointer-events-none -z-0" />

      {/* ── 1. Top Navbar Header ───────────────────────────────── */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
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
            <span>{isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}</span>
            <Link
              href={inviteToken ? `/login?invite=${encodeURIComponent(inviteToken)}` : "/login"}
              className="font-bold text-[#00A389] dark:text-[#6BD8CB] hover:underline"
            >
              {isAr ? "تسجيل الدخول" : "Sign In"}
            </Link>
          </div>
        </div>
      </header>

      {/* ── 2. Center Card (Frosted Glass Container) ───────────── */}
      <main className="max-w-4xl w-full mx-auto my-auto py-6 relative z-10">
        <div className="rounded-3xl raycast-navbar-glass p-8 sm:p-12 relative overflow-hidden">
          {success ? (
            <div className="text-center py-8 space-y-5 max-w-md mx-auto">
              <div className="mx-auto h-16 w-16 rounded-full bg-[#00A389]/20 text-[#00A389] dark:text-[#6BD8CB] flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isAr ? "تفقد بريدك الإلكتروني 📩" : "Check Your Email 📩"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isAr
                  ? `تم إرسال رابط تأكيد وتفعيل الحساب إلى ${email}. يرجى الضغط على الرابط لتسجيل الدخول.`
                  : `We've sent a verification link to ${email}. Please check your inbox and click the link to activate your account.`}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full rounded-xl bg-foreground text-background hover:bg-foreground/90 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                {isAr ? "الانتقال لتسجيل الدخول" : "Proceed to Sign In"}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
              {/* Left Column: Feature Checkmarks & Testimonial (~42%) */}
              <div className="md:col-span-5 space-y-8 md:pe-4 md:border-e md:border-black/10 dark:md:border-white/10">
                <div className="space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                    {isAr ? "ابدأ أتمتة مبيعاتك عبر واتساب اليوم" : "Start Automating Your WhatsApp Sales Today"}
                  </h2>

                  <ul className="space-y-4 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="text-foreground/90">{isAr ? "ربط فوري عبر رمز QR أو Meta Cloud API" : "Instant setup via QR code or official API"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="text-foreground/90">{isAr ? "أتمتة استقبال وتوثيق الطلبات بالذكاء الاصطناعي" : "Automate order taking with AI responses"}</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" strokeWidth={1.5} />
                      <span className="text-foreground/90">{isAr ? "إشعارات وتنبيهات فورية للموظفين عبر تيليجرام" : "Real-time Telegram notifications for staff"}</span>
                    </li>
                  </ul>
                </div>

                {/* Testimonial Box */}
                <div className="pt-6 border-t border-black/10 dark:border-white/10 space-y-2.5">
                  <div className="flex items-center gap-1 text-amber-500 text-sm">
                    {"★★★★★"}
                  </div>
                  <p className="font-serif italic text-xs text-muted-foreground leading-relaxed">
                    {isAr
                      ? `"ضاعفت المنصة سرعة استقبال الطلبات 3 مرات خلال الأسبوع الأول. الذكاء الاصطناعي يجيب على الاستفسارات وفريقنا يركز على التجهيز."`
                      : `"${platformName} increased our order intake by 3x within the first week. The AI handles basic queries while our team focuses on fulfillment."`}
                  </p>
                  <span className="block text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                    {isAr ? "سارة ج. - مديرة التجارة الإلكترونية" : "SARAH J. - E-COMMERCE DIRECTOR"}
                  </span>
                </div>
              </div>

              {/* Right Column: Registration Form (~58%) */}
              <div className="md:col-span-7 space-y-5">
                <h3 className="text-xl font-bold text-foreground">
                  {isAr ? "إنشاء حساب جديد" : "Create Your Account"}
                </h3>

                {/* Google Sign In Button */}
                {googleAuthEnabled && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleAuth}
                      disabled={googleLoading}
                      className="w-full h-11 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.07] dark:hover:bg-white/[0.1] border border-black/10 dark:border-white/10 text-foreground text-xs font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
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
                          <span>{isAr ? "المتابعة عبر Google" : "Continue with Google"}</span>
                        </>
                      )}
                    </button>

                    <div className="relative flex items-center justify-center my-3">
                      <div className="border-t border-black/10 dark:border-white/10 w-full" />
                      <span className="bg-transparent px-3 text-[11px] text-muted-foreground font-medium">
                        {isAr ? "أو التسجيل عبر البريد الإلكتروني" : "or register with email"}
                      </span>
                    </div>
                  </>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs font-semibold">
                    ⚠️ {error}
                  </div>
                )}

                {/* Signup Form */}
                <form onSubmit={handleSignup} className="space-y-3.5">
                  {/* Row 1: Full Name & Business Name */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5 text-start">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        {isAr ? "الاسم الكامل" : "Full Name"}
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isAr ? "محمد علي" : "Jane Doe"}
                        className="w-full h-11 px-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground border border-black/10 dark:border-white/10 text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5 text-start">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        {isAr ? "اسم النشاط التجاري" : "Business Name"}
                      </label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder={isAr ? "شركة النماء" : "Acme Corp"}
                        className="w-full h-11 px-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground border border-black/10 dark:border-white/10 text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 2: Work Email */}
                  <div className="space-y-1.5 text-start">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      {isAr ? "بريد العمل الإلكتروني" : "Work Email"}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@acme.com"
                      className="w-full h-11 px-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] text-foreground border border-black/10 dark:border-white/10 text-xs font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/40 dir-ltr text-start transition-all"
                    />
                  </div>

                  {/* Row 3: Password */}
                  <div className="space-y-1.5 text-start">
                    <label className="text-[11px] font-semibold text-muted-foreground">
                      {isAr ? "كلمة المرور" : "Password"}
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

                  {/* Agree to Terms Checkbox */}
                  <div className="flex items-center gap-2 pt-1 text-start">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-black/20 dark:border-white/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-[11px] text-muted-foreground select-none cursor-pointer">
                      {isAr ? (
                        <>
                          أوافق على{" "}
                          <Link href="/p/terms" className="text-foreground hover:underline font-medium">
                            شروط الخدمة
                          </Link>{" "}
                          و{" "}
                          <Link href="/p/privacy" className="text-foreground hover:underline font-medium">
                            سياسة الخصوصية
                          </Link>
                        </>
                      ) : (
                        <>
                          I agree to the{" "}
                          <Link href="/p/terms" className="text-foreground hover:underline font-medium">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/p/privacy" className="text-foreground hover:underline font-medium">
                            Privacy Policy
                          </Link>
                        </>
                      )}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-wider text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      isAr ? "إنشاء حساب مجاني" : "CREATE FREE ACCOUNT"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── 3. Bottom Trust Badges & Copyright Bar ───────────────── */}
      <footer className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-4 text-[11px] text-muted-foreground border-t border-black/5 dark:border-white/5 relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>{isAr ? "حماية بيانات 100%" : "100% Data Security"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>{isAr ? "لا يلزم وجود بطاقة ائتمان" : "No Credit Card Required"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5 text-emerald-500" strokeWidth={1.5} />
            <span>{isAr ? "إلغاء في أي وقت" : "Cancel Anytime"}</span>
          </div>
        </div>

        <div>
          {isAr
            ? `جميع الحقوق محفوظة © ${new Date().getFullYear()} ${platformName}.`
            : `All rights reserved © ${new Date().getFullYear()} ${platformName}.`}
        </div>
      </footer>
    </div>
  );
}
