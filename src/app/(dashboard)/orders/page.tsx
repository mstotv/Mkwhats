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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Orders");
  const [fields, setFields] = useState<FormField[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [excelFeatureAllowed, setExcelFeatureAllowed] = useState<boolean>(true);
  const [featureReason, setFeatureReason] = useState<string>("");

  useEffect(() => {
    async function checkSubscription() {
      try {
        const res = await fetch("/api/account/subscription");
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim().length > 0) {
            try {
              const data = JSON.parse(text);
              const hasExcelFeature = Boolean(
                data?.features?.excel_export ?? data?.plan?.features?.excel_export,
              );
              setExcelFeatureAllowed(hasExcelFeature);
              if (!hasExcelFeature) {
                setFeatureReason(t("featureReason"));
              }
            } catch {
              setExcelFeatureAllowed(true);
            }
          }
        }
      } catch (err) {
        console.error("Error checking subscription:", err);
      }
    }
    checkSubscription();
  }, [t]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/orders"
          : `/api/orders?status=${statusFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(t("errorFetch"));
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      setFields(data.fields || []);
      setOrders(data.orders || []);
    } catch (err: any) {
      toast.error(err.message || t("errorFetch"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleExport = async () => {
    if (!excelFeatureAllowed) {
      toast.error(t("upgradeRequired"));
      return;
    }
    setExporting(true);
    try {
      const res = await fetch("/api/orders/export", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("errorExport"));
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("exportSuccess"));
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || t("errorExport"));
    } finally {
      setExporting(false);
    }
  };

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
            {t("statusConfirmed")}
          </Badge>
        );
      case "exported":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1 w-fit">
            <FileCheck2 className="size-3" />
            {t("statusExported")}
          </Badge>
        );
      case "collecting":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1 w-fit">
            <Clock className="size-3" />
            {t("statusCollecting")}
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-muted text-muted-foreground border-border flex items-center gap-1 w-fit">
            <XCircle className="size-3" />
            {t("statusCancelled")}
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
                {t("title")}
              </h1>
              <p className="text-xs text-muted-foreground">
                {t("description")}
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
            {t("refresh")}
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
            {t("exportExcel")}
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
              <p className="text-sm font-semibold">{t("upgradeAlertTitle")}</p>
              <p className="text-xs opacity-90">{featureReason}</p>
            </div>
          </div>
          <Link href="/settings?tab=plan">
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0">
              <Sparkles className="size-3.5" />
              {t("upgradeNow")}
            </Button>
          </Link>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-border p-1 bg-card">
          {[
            { id: "all", label: t("tabs.all") },
            { id: "confirmed", label: t("tabs.confirmed") },
            { id: "exported", label: t("tabs.exported") },
            { id: "collecting", label: t("tabs.collecting") },
            { id: "cancelled", label: t("tabs.cancelled") },
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

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-border bg-card pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <RefreshCw className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 p-6 text-center">
          <ShoppingBag className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-semibold text-foreground">{t("emptyTitle")}</p>
          <p className="text-xs text-muted-foreground max-w-sm mt-1">
            {t("emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border font-medium">
              <tr>
                <th className="px-4 py-3">{t("columns.contact")}</th>
                <th className="px-4 py-3">{t("columns.status")}</th>
                <th className="px-4 py-3">{t("columns.orderDate")}</th>
                {fields.map((f) => (
                  <th key={f.field_key} className="px-4 py-3">
                    {f.field_label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right rtl:text-left">{t("columns.exportedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-semibold">{o.contactName || t("unknownContact")}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {o.contactPhone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(o.status)}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()}
                  </td>
                  {fields.map((f) => (
                    <td key={f.field_key} className="px-4 py-3 text-foreground">
                      {o.fieldValues[f.field_key] || "-"}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right rtl:text-left text-muted-foreground font-mono text-[11px]">
                    {o.exportedAt ? new Date(o.exportedAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
