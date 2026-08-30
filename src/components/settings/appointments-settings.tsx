"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  Globe,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sun,
  Moon,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";
import type { BusinessHour, AppointmentSettings } from "@/lib/appointments/types";

const TIMEZONES = [
  { value: "Asia/Baghdad", label: "بغداد (UTC+3 / Baghdad)" },
  { value: "Asia/Riyadh", label: "الرياض (UTC+3 / Riyadh)" },
  { value: "Africa/Cairo", label: "القاهرة (UTC+2 / Cairo)" },
  { value: "Asia/Dubai", label: "دبي (UTC+4 / Dubai)" },
  { value: "Asia/Amman", label: "عمّان (UTC+3 / Amman)" },
  { value: "Asia/Beirut", label: "بيروت (UTC+3 / Beirut)" },
  { value: "Asia/Kuwait", label: "الكويت (UTC+3 / Kuwait)" },
  { value: "Asia/Qatar", label: "قطر (UTC+3 / Qatar)" },
  { value: "Asia/Muscat", label: "مسقط (UTC+4 / Muscat)" },
  { value: "Africa/Tripoli", label: "طرابلس (UTC+2 / Tripoli)" },
  { value: "Africa/Algiers", label: "الجزائر (UTC+1 / Algiers)" },
  { value: "Africa/Casablanca", label: "الدار البيضاء (UTC+1 / Casablanca)" },
  { value: "Europe/London", label: "لندن (UTC+0 / London)" },
  { value: "Europe/Istanbul", label: "إسطنبول (UTC+3 / Istanbul)" },
  { value: "UTC", label: "التوقيت العالمي (UTC)" },
];

const DAY_NAMES_AR = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SLOT_DURATIONS = [
  { value: 15, label: "15 دقيقة / 15 mins" },
  { value: 30, label: "30 دقيقة / 30 mins" },
  { value: 45, label: "45 دقيقة / 45 mins" },
  { value: 60, label: "60 دقيقة (ساعة) / 1 hour" },
  { value: 90, label: "90 دقيقة / 1.5 hours" },
  { value: 120, label: "120 دقيقة (ساعتان) / 2 hours" },
];

export function AppointmentsSettings() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  // Settings state
  const [appointmentsEnabled, setAppointmentsEnabled] = useState(false);
  const [slotDuration, setSlotDuration] = useState(60);
  const [timezone, setTimezone] = useState("Asia/Baghdad");
  const [serviceLabel, setServiceLabel] = useState("الخدمة");
  const [confirmationMsg, setConfirmationMsg] = useState("");

  // Business hours state (0..6)
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);

  // Load all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, hoursRes] = await Promise.all([
        fetch("/api/account/appointment-settings"),
        fetch("/api/account/business-hours"),
      ]);

      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        setAppointmentsEnabled(Boolean(sData.appointments_enabled));
        if (sData.settings) {
          setSlotDuration(sData.settings.slot_duration_minutes || 60);
          setTimezone(sData.settings.timezone || "Asia/Baghdad");
          setServiceLabel(sData.settings.service_label || "الخدمة");
          setConfirmationMsg(sData.settings.booking_confirmation_msg || "");
        }
      }

      if (hoursRes.ok) {
        const hData = await hoursRes.json();
        if (Array.isArray(hData.business_hours)) {
          setBusinessHours(hData.business_hours);
        }
      }
    } catch (err: any) {
      toast.error(isAr ? "تعذر تحميل إعدادات المواعيد" : "Failed to load appointment settings");
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save general settings & AI switch
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/account/appointment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointments_enabled: appointmentsEnabled,
          slot_duration_minutes: slotDuration,
          timezone,
          service_label: serviceLabel,
          booking_confirmation_msg: confirmationMsg,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update settings");
      }

      toast.success(
        isAr ? "تم حفظ إعدادات المواعيد بنجاح! ✨" : "Appointment settings saved successfully! ✨"
      );
    } catch (err: any) {
      toast.error(err.message || (isAr ? "حدث خطأ أثناء الحفظ" : "Save failed"));
    } finally {
      setSavingSettings(false);
    }
  };

  // Save business hours
  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      const res = await fetch("/api/account/business-hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business_hours: businessHours }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to update business hours");
      }

      toast.success(
        isAr ? "تم حفظ ساعات وأيام العمل بنجاح! 🕒" : "Business hours saved successfully! 🕒"
      );
    } catch (err: any) {
      toast.error(err.message || (isAr ? "حدث خطأ أثناء حفظ ساعات العمل" : "Save hours failed"));
    } finally {
      setSavingHours(false);
    }
  };

  // Update a single day's hours
  const updateDay = (dayIndex: number, updates: Partial<BusinessHour>) => {
    setBusinessHours((prev) =>
      prev.map((item) => (item.day_of_week === dayIndex ? { ...item, ...updates } : item))
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Header & AI Feature Flag Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {isAr ? "نظام حجز المواعيد الآلي (Appointments)" : "Automated Appointment Booking"}
                </h2>
                <Badge
                  className={
                    appointmentsEnabled
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }
                >
                  {appointmentsEnabled
                    ? isAr
                      ? "مفعّل ⚡"
                      : "Active ⚡"
                    : isAr
                    ? "معطل"
                    : "Disabled"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? "تفعيل استقبال وحجز المواعيد آلياً عبر الذكاء الاصطناعي على واتساب بدون تعارض مع أوقات عملك."
                  : "Enable AI to automatically schedule and confirm customer appointments on WhatsApp within your business hours."}
              </p>
            </div>
          </div>

          {/* AI Appointments Switch */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground">
              {isAr ? "حجز المواعيد بالذكاء الاصطناعي" : "AI Appointments"}
            </span>
            <button
              type="button"
              onClick={() => setAppointmentsEnabled(!appointmentsEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                appointmentsEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  appointmentsEnabled
                    ? isAr
                      ? "-translate-x-5"
                      : "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* General Settings Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="size-3.5 text-primary" />
              {isAr ? "المنطقة الزمنية للحساب (Timezone)" : "Account Timezone"}
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? "تُعرض المواعيد للعملاء وتُحسب ساعات العمل بدقة بناءً على هذا التوقيت."
                : "Appointments and availability checks will strictly follow this timezone."}
            </p>
          </div>

          {/* Slot Duration */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Clock className="size-3.5 text-primary" />
              {isAr ? "مدة الموعد الافتراضية (Slot Duration)" : "Default Slot Duration"}
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {SLOT_DURATIONS.map((dur) => (
                <option key={dur.value} value={dur.value}>
                  {dur.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              {isAr
                ? "المدة المحجوزة لكل موعد لمنع تداخل المواعيد المتتالية."
                : "Duration allocated for each booked appointment to prevent overlaps."}
            </p>
          </div>

          {/* Service Label */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {isAr ? "تسمية حقل الخدمة (Service Label)" : "Service Field Label"}
            </label>
            <input
              type="text"
              value={serviceLabel}
              onChange={(e) => setServiceLabel(e.target.value)}
              placeholder={isAr ? "مثال: نوع الكشف / الخدمة المطلوبة" : "e.g. Service / Consultation"}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Confirmation Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              {isAr ? "رسالة التأكيد المخصصة" : "Custom Confirmation Note"}
            </label>
            <input
              type="text"
              value={confirmationMsg}
              onChange={(e) => setConfirmationMsg(e.target.value)}
              placeholder={
                isAr
                  ? "مثال: تم تأكيد موعدك بنجاح! نحن بانتظارك. ✨"
                  : "e.g. Your appointment is confirmed! See you soon. ✨"
              }
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-5 border-t border-border/50 mt-5">
          <Button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="h-9 gap-2 font-medium bg-primary text-primary-foreground shadow-sm"
          >
            {savingSettings ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isAr ? "حفظ إعدادات المواعيد" : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* 2. Weekly Business Hours Schedule */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {isAr ? "جدول ساعات وأيام العمل الرسمية (Business Hours)" : "Weekly Business Hours"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "حدد أوقات بدء ونهاية العمل لكل يوم. الأيام المغلقة لن يقبل الذكاء الاصطناعي حجز أي موعد فيها."
                : "Set your daily opening and closing hours. Closed days will automatically be blocked by the AI."}
            </p>
          </div>

          <Button
            onClick={handleSaveHours}
            disabled={savingHours}
            className="h-9 gap-2 font-medium bg-primary text-primary-foreground shadow-sm self-end sm:self-auto"
          >
            {savingHours ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {isAr ? "حفظ ساعات العمل" : "Save Hours"}
          </Button>
        </div>

        {/* Days Table / List */}
        <div className="divide-y divide-border/60 mt-4">
          {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
            const bh = businessHours.find((h) => h.day_of_week === dayIdx) || {
              day_of_week: dayIdx,
              is_open: dayIdx !== 5,
              open_time: "09:00:00",
              close_time: "17:00:00",
            };

            const dayName = isAr ? DAY_NAMES_AR[dayIdx] : DAY_NAMES_EN[dayIdx];

            return (
              <div
                key={dayIdx}
                className={`py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors rounded-xl px-3 ${
                  bh.is_open ? "hover:bg-muted/20" : "bg-muted/30 opacity-75"
                }`}
              >
                {/* Day Name & Toggle */}
                <div className="flex items-center gap-3 min-w-[140px]">
                  <input
                    type="checkbox"
                    id={`day-toggle-${dayIdx}`}
                    checked={bh.is_open}
                    onChange={(e) => updateDay(dayIdx, { is_open: e.target.checked })}
                    className="size-4 rounded text-primary focus:ring-primary border-border"
                  />
                  <label
                    htmlFor={`day-toggle-${dayIdx}`}
                    className="text-xs font-bold text-foreground cursor-pointer"
                  >
                    {dayName}
                  </label>
                  {!bh.is_open && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground py-0">
                      {isAr ? "عطلة مغلق" : "Closed"}
                    </Badge>
                  )}
                </div>

                {/* Time Range Pickers */}
                {bh.is_open ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {isAr ? "من:" : "From:"}
                      </span>
                      <input
                        type="time"
                        value={bh.open_time.slice(0, 5)}
                        onChange={(e) =>
                          updateDay(dayIdx, { open_time: `${e.target.value}:00` })
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">—</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {isAr ? "إلى:" : "To:"}
                      </span>
                      <input
                        type="time"
                        value={bh.close_time.slice(0, 5)}
                        onChange={(e) =>
                          updateDay(dayIdx, { close_time: `${e.target.value}:00` })
                        }
                        className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">
                    {isAr ? "مغلق طوال اليوم" : "Closed all day"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
