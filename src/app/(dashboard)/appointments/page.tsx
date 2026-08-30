"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  Clock,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Settings,
  User,
  Phone,
  Tag,
  FileText,
  CalendarCheck,
  CalendarX,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import type { Appointment, AppointmentSettings, AppointmentStatus } from "@/lib/appointments/types";

export default function AppointmentsPage() {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<AppointmentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal for new appointment
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAppt, setAddingAppt] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formService, setFormService] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("10:00");
  const [formNotes, setFormNotes] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/appointments"
          : `/api/appointments?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      const data = await res.json();
      setAppointments(data.appointments || []);
      if (data.settings) setSettings(data.settings);
    } catch (err: any) {
      toast.error(err.message || (isAr ? "تعذر جلب المواعيد" : "Failed to load appointments"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, isAr]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Handle status update
  const handleUpdateStatus = async (id: string, newStatus: AppointmentStatus) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Update failed");
      }

      toast.success(
        isAr ? "تم تحديث حالة الموعد بنجاح" : "Appointment status updated"
      );
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || (isAr ? "فشل التحديث" : "Failed to update"));
    }
  };

  // Handle manual appointment creation
  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim() || !formDate || !formTime) {
      toast.error(isAr ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields");
      return;
    }

    setAddingAppt(true);
    try {
      const scheduledAtUtc = new Date(`${formDate}T${formTime}:00`).toISOString();

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: formName,
          customer_phone: formPhone,
          service_name: formService,
          scheduled_at: scheduledAtUtc,
          notes: formNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Booking failed");
      }

      toast.success(isAr ? "تم حجز الموعد بنجاح! 📅" : "Appointment scheduled! 📅");
      setShowAddModal(false);
      setFormName("");
      setFormPhone("");
      setFormService("");
      setFormNotes("");
      fetchAppointments();
    } catch (err: any) {
      toast.error(err.message || (isAr ? "تعذر الحجز" : "Booking failed"));
    } finally {
      setAddingAppt(false);
    }
  };

  // Filtered appointments
  const filteredAppointments = appointments.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = a.customer_name.toLowerCase().includes(q);
    const phoneMatch = a.customer_phone.toLowerCase().includes(q);
    const serviceMatch = a.service_name?.toLowerCase().includes(q) || false;
    return nameMatch || phoneMatch || serviceMatch;
  });

  // Calculate quick stats
  const totalCount = appointments.length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter((a) => a.scheduled_at.startsWith(todayStr)).length;

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="size-3" />
            {isAr ? "مؤكد" : "Confirmed"}
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock className="size-3" />
            {isAr ? "بانتظار التأكيد" : "Pending"}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1 w-fit">
            <XCircle className="size-3" />
            {isAr ? "ملغى" : "Cancelled"}
          </Badge>
        );
      case "no_show":
        return (
          <Badge className="bg-muted text-muted-foreground border-border flex items-center gap-1 w-fit">
            <UserX className="size-3" />
            {isAr ? "لم يحضر" : "No-show"}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatLocalDate = (isoStr: string) => {
    const tz = settings?.timezone || "Asia/Baghdad";
    try {
      return new Intl.DateTimeFormat(isAr ? "ar-IQ" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: tz,
      }).format(new Date(isoStr));
    } catch {
      return new Date(isoStr).toLocaleString();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {isAr ? "إدارة المواعيد (Appointments)" : "Appointments Management"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "عرض وإدارة جميع المواعيد المحجوزة آلياً عبر الذكاء الاصطناعي أو المضافة يدوياً."
                : "View and manage all automated AI bookings and manual appointments."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <Link href="/settings?tab=appointments">
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Settings className="size-3.5" />
              {isAr ? "أوقات العمل" : "Business Hours"}
            </Button>
          </Link>

          <Button
            onClick={() => setShowAddModal(true)}
            size="sm"
            className="h-9 gap-2 font-medium bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="size-4" />
            {isAr ? "إضافة موعد جديد" : "New Appointment"}
          </Button>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-medium">
            {isAr ? "إجمالي المواعيد" : "Total Bookings"}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{totalCount}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {isAr ? "المؤكدة ✓" : "Confirmed ✓"}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {confirmedCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-sm">
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {isAr ? "بانتظار التأكيد ⏳" : "Pending ⏳"}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <p className="text-xs text-primary font-medium">
            {isAr ? "مواعيد اليوم 📅" : "Today's Slots 📅"}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{todayCount}</p>
        </div>
      </div>

      {/* 3. Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border p-1 bg-card">
          {[
            { id: "all", label: isAr ? "الكل" : "All" },
            { id: "confirmed", label: isAr ? "مؤكد" : "Confirmed" },
            { id: "pending", label: isAr ? "قيد الانتظار" : "Pending" },
            { id: "cancelled", label: isAr ? "ملغى" : "Cancelled" },
            { id: "no_show", label: isAr ? "لم يحضر" : "No-Show" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? "بحث بالاسم، الرقم، أو الخدمة..." : "Search name, phone, service..."}
            className="w-full rounded-xl border border-border bg-card pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Appointments Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 p-6 text-center">
          <Calendar className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-semibold text-foreground">
            {isAr ? "لا توجد مواعيد مطابقة" : "No appointments found"}
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {isAr
              ? "سيتم إدراج المواعيد تلقائياً عند قيام العملاء بحجزها عبر واتساب، أو يمكنك حجز موعد يدوياً."
              : "Bookings made on WhatsApp will appear here automatically, or you can add one manually."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border font-medium">
              <tr>
                <th className="px-4 py-3">{isAr ? "العميل" : "Customer"}</th>
                <th className="px-4 py-3">{settings?.service_label || (isAr ? "الخدمة" : "Service")}</th>
                <th className="px-4 py-3">{isAr ? "تاريخ ووقت الموعد" : "Scheduled Time"}</th>
                <th className="px-4 py-3">{isAr ? "المدة" : "Duration"}</th>
                <th className="px-4 py-3">{isAr ? "الحالة" : "Status"}</th>
                <th className="px-4 py-3 text-right rtl:text-left">{isAr ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredAppointments.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  {/* Customer */}
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold">{a.customer_name || (isAr ? "عميل" : "Customer")}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {a.customer_phone}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Service */}
                  <td className="px-4 py-3 text-foreground font-medium">
                    {a.service_name || "—"}
                  </td>

                  {/* Date & Time */}
                  <td className="px-4 py-3 text-foreground font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-primary shrink-0" />
                      <span>{formatLocalDate(a.scheduled_at)}</span>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.duration_minutes} {isAr ? "دقيقة" : "mins"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">{getStatusBadge(a.status)}</td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right rtl:text-left">
                    <div className="flex items-center justify-end rtl:justify-start gap-1">
                      {/* Send Reminder Button */}
                      {a.status === "confirmed" && (
                        <button
                          onClick={async () => {
                            try {
                              toast.loading(isAr ? "جاري إرسال التذكير..." : "Sending reminder...", { id: "remind-" + a.id });
                              const res = await fetch("/api/appointments/reminders?force=true");
                              const d = await res.json();
                              if (d.success) {
                                toast.success(isAr ? "تم إرسال التذكير بنجاح عبر الواتساب! 📲✨" : "Reminder sent successfully! 📲✨", { id: "remind-" + a.id });
                                fetchAppointments();
                              } else {
                                toast.error(d.message || (isAr ? "تعذر إرسال التذكير" : "Failed to send"), { id: "remind-" + a.id });
                              }
                            } catch {
                              toast.error(isAr ? "حدث خطأ أثناء الإرسال" : "Error sending", { id: "remind-" + a.id });
                            }
                          }}
                          title={isAr ? "إرسال رسالة تذكير فورية للعميل" : "Send WhatsApp Reminder"}
                          className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <Bell className="size-4" />
                        </button>
                      )}
                      {a.status !== "confirmed" && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, "confirmed")}
                          title={isAr ? "تأكيد الموعد" : "Confirm"}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                        >
                          <CheckCircle2 className="size-4" />
                        </button>
                      )}
                      {a.status !== "cancelled" && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, "cancelled")}
                          title={isAr ? "إلغاء الموعد" : "Cancel"}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-500/10 transition-colors"
                        >
                          <XCircle className="size-4" />
                        </button>
                      )}
                      {a.status !== "no_show" && (
                        <button
                          onClick={() => handleUpdateStatus(a.id, "no_show")}
                          title={isAr ? "تسجيل عدم حضور" : "Mark No-Show"}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <UserX className="size-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Add Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Calendar className="size-5 text-primary" />
                {isAr ? "حجز موعد جديد" : "New Appointment"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                <XCircle className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddAppointment} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="size-3.5 text-primary" />
                  {isAr ? "اسم العميل *" : "Customer Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={isAr ? "مثال: أحمد علي" : "e.g. John Doe"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="size-3.5 text-primary" />
                  {isAr ? "رقم الهاتف / الواتساب *" : "Phone / WhatsApp *"}
                </label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder={isAr ? "+964 770 000 0000" : "+1 555 000 0000"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="size-3.5 text-primary" />
                  {settings?.service_label || (isAr ? "الخدمة المطلوبة" : "Service Name")}
                </label>
                <input
                  type="text"
                  value={formService}
                  onChange={(e) => setFormService(e.target.value)}
                  placeholder={isAr ? "مثال: كشف عام / استشارة" : "e.g. General Consultation"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {isAr ? "التاريخ *" : "Date *"}
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">
                    {isAr ? "الوقت *" : "Time *"}
                  </label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="size-3.5 text-primary" />
                  {isAr ? "ملاحظات إضافية" : "Notes"}
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder={isAr ? "ملاحظات اختيارية عن الموعد..." : "Optional booking notes..."}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  disabled={addingAppt}
                  size="sm"
                  className="bg-primary text-primary-foreground font-medium"
                >
                  {addingAppt ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <CalendarCheck className="size-4" />
                  )}
                  {isAr ? "تأكيد الحجز" : "Confirm Booking"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
