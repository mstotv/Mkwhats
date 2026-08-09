"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Download,
  FileSpreadsheet,
  Lock,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FormField {
  field_key: string;
  field_label: string;
  field_type: string;
  choices: string[] | null;
  is_required: boolean;
  sort_order: number;
}

interface Order {
  id: string;
  conversationId: string;
  contactId: string | null;
  contactName: string;
  contactPhone: string;
  contactAvatar: string | null;
  status: "collecting" | "confirmed" | "exported" | "cancelled";
  confirmedAt: string | null;
  exportedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fieldValues: Record<string, string>;
}

export default function OrdersPage() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [excelFeatureAllowed, setExcelFeatureAllowed] = useState<boolean>(true);
  const [featureReason, setFeatureReason] = useState<string>("");

  // 1. Fetch Subscription to check excel_export feature flag
  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/account/subscription");
        if (res.ok) {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            const hasExcelFeature = Boolean(data?.plan?.features?.excel_export);
            setExcelFeatureAllowed(hasExcelFeature);
            if (!hasExcelFeature) {
              setFeatureReason(
                "ميزة تصدير Excel غير مفعّلة في خطتك الحالية. يرجى الترقية لتفعيل التصدير."
              );
            }
          }
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      }
    }
    checkSubscription();
  }, []);

  // 2. Fetch Orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/orders"
          : `/api/orders?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("فشل جلب قائمة الطلبات");
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setFields(data.fields || []);
      setOrders(data.orders || []);
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء جلب الطلبات");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 3. Export to Excel
  const handleExport = async () => {
    if (!excelFeatureAllowed) {
      toast.error(featureReason || "تصدير Excel يتطلب ترقية الخطة");
      return;
    }

    const confirmedCount = orders.filter(
      (o) => o.status === "confirmed" || o.status === "exported"
    ).length;
    if (confirmedCount === 0) {
      toast.info("لا توجد طلبات مؤكدة أو مصدّرة حالياً للتصدير");
      return;
    }

    setExporting(true);
    try {
      const res = await fetch("/api/orders/export");
      if (!res.ok) {
        const text = await res.text();
        let errorMsg = "فشل تصدير ملف Excel";
        if (text) {
          try {
            const errObj = JSON.parse(text);
            errorMsg = errObj.error || errorMsg;
          } catch (e) {}
        }
        throw new Error(errorMsg);
      }

      // Download file blob
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const filename = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      a.remove();

      toast.success("تم تصدير الطلبات بنجاح وتحديث حالتها إلى 'مصدّر'");

      // Refresh orders to update status in UI
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تصدير الملف");
    } finally {
      setExporting(false);
    }
  };

  // Filtered by local search query (by contact name or phone)
  const filteredOrders = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = o.contactName.toLowerCase().includes(q);
    const phoneMatch = o.contactPhone.toLowerCase().includes(q);
    const fieldMatch = Object.values(o.fieldValues).some((val) =>
      val.toLowerCase().includes(q)
    );
    return nameMatch || phoneMatch || fieldMatch;
  });

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1 w-fit">
            <CheckCircle2 className="size-3" />
            مؤكد
          </Badge>
        );
      case "exported":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1 w-fit">
            <FileCheck2 className="size-3" />
            مصدّر
          </Badge>
        );
      case "collecting":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock className="size-3" />
            قيد الجمع
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-muted text-muted-foreground border-border flex items-center gap-1 w-fit">
            <XCircle className="size-3" />
            ملغى
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                طلبات العملاء
              </h1>
              <p className="text-xs text-muted-foreground">
                متابعة وتصدير الطلبات المجمّعة بواسطة الذكاء الاصطناعي
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          <Button
            onClick={handleExport}
            disabled={exporting || loading}
            className="h-9 gap-2 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {exporting ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : !excelFeatureAllowed ? (
              <Lock className="size-4 text-amber-200" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Feature Plan Upgrade Alert */}
      {!excelFeatureAllowed && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Lock className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">ميزة تصدير Excel غير متوفرة بخطتك الحالية</p>
              <p className="text-xs opacity-90">{featureReason}</p>
            </div>
          </div>
          <Link href="/settings?tab=plan">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0">
              <Sparkles className="size-3.5" />
              ترقية الخطة الآن
            </Button>
          </Link>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border p-1 bg-card">
          {[
            { id: "all", label: "الكل" },
            { id: "confirmed", label: "المؤكدة" },
            { id: "exported", label: "المصدّرة" },
            { id: "collecting", label: "قيد الجمع" },
            { id: "cancelled", label: "الملغاة" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث باسم العميل أو الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pr-9 pl-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="size-6 animate-spin mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">جاري تحميل الطلبات...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">لا توجد طلبات</p>
              <p className="text-xs text-muted-foreground">
                لم يتم العثور على أي طلبات تطابق الفلتر المالي الحالي.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-3 px-4">العميل</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">تاريخ الطلب</th>
                  {fields.map((f) => (
                    <th key={f.field_key} className="py-3 px-4">
                      {f.field_label}
                    </th>
                  ))}
                  <th className="py-3 px-4">تاريخ التصدير</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    {/* Contact Info */}
                    <td className="py-3.5 px-4 font-medium text-foreground">
                      <div>
                        <p className="font-semibold text-sm">{order.contactName}</p>
                        <p className="text-[11px] text-muted-foreground dir-ltr text-right">
                          {order.contactPhone}
                        </p>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4">{getStatusBadge(order.status)}</td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {order.confirmedAt
                        ? new Date(order.confirmedAt).toLocaleDateString("ar-SA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(order.createdAt).toLocaleDateString("ar-SA", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </td>

                    {/* Dynamic Fields */}
                    {fields.map((f) => (
                      <td key={f.field_key} className="py-3.5 px-4">
                        {order.fieldValues[f.field_key] ? (
                          <span className="font-medium text-foreground">
                            {order.fieldValues[f.field_key]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground opacity-40">-</span>
                        )}
                      </td>
                    ))}

                    {/* Exported At */}
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      {order.exportedAt ? (
                        new Date(order.exportedAt).toLocaleDateString("ar-SA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        <span className="text-muted-foreground opacity-40">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
