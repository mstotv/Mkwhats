import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ForgotPasswordClient, type ForgotPasswordInitialSettings } from "./forgot-password-client";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const locale = (await getLocale()) as "en" | "ar";
  const isAr = locale === "ar";
  const serviceClient = createServiceClient();

  const { data: settings } = await serviceClient
    .from("site_settings")
    .select("platform_name, platform_name_ar, platform_name_en, logo_url, logo_height, support_whatsapp")
    .limit(1)
    .maybeSingle();

  const platformName = isAr
    ? (settings?.platform_name_ar || settings?.platform_name || settings?.platform_name_en || "")
    : (settings?.platform_name_en || settings?.platform_name || settings?.platform_name_ar || "");

  const initialSettings: ForgotPasswordInitialSettings = {
    platformName: platformName || (isAr ? "المنصة" : "Platform"),
    logoUrl: settings?.logo_url || "",
    logoHeight: settings?.logo_height || 32,
    supportWhatsapp: settings?.support_whatsapp || "",
  };

  return (
    <Suspense fallback={null}>
      <ForgotPasswordClient initialSettings={initialSettings} />
    </Suspense>
  );
}
