import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Cairo, Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/hooks/use-theme";
import { ThemedToaster } from "@/components/themed-toaster";
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  MODES,
  STORAGE_KEY,
  THEME_IDS,
} from "@/lib/themes";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

import { createServiceClient } from "@/lib/supabase/service";

export async function generateMetadata(): Promise<Metadata> {
  let title = "mkwacrm";
  let favicon = "/icon";

  try {
    const supabase = createServiceClient();
    const { data: settings } = await supabase
      .from("site_settings")
      .select("platform_name, platform_name_en, platform_name_ar, favicon_url")
      .limit(1)
      .maybeSingle();

    if (settings) {
      title =
        settings.platform_name_en?.trim() ||
        settings.platform_name?.trim() ||
        settings.platform_name_ar?.trim() ||
        "mkwacrm";

      if (settings.favicon_url?.trim()) {
        favicon = settings.favicon_url.trim();
      }
    }
  } catch {
    // Keep safe defaults if database is unreachable at build time
  }

  return {
    title: {
      default: title,
      template: `%s — ${title}`,
    },
    description: "Enterprise WhatsApp CRM, Marketing & AI Automation Platform.",
    robots: {
      index: false,
      follow: false,
    },
    icons: {
      icon: [{ url: favicon }],
      shortcut: [{ url: favicon }],
      apple: [{ url: favicon }],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light dark",
};

const THEME_BOOT_SCRIPT = `
(function(){
  var d = document.documentElement;
  try {
    var THEME_KEY = ${JSON.stringify(STORAGE_KEY)};
    var THEME_DEFAULT = ${JSON.stringify(DEFAULT_THEME)};
    var THEMES = ${JSON.stringify(THEME_IDS)};
    var savedTheme = localStorage.getItem(THEME_KEY);
    d.dataset.theme = THEMES.indexOf(savedTheme) !== -1 ? savedTheme : THEME_DEFAULT;

    var MODE_KEY = ${JSON.stringify(MODE_STORAGE_KEY)};
    var MODE_DEFAULT = ${JSON.stringify(DEFAULT_MODE)};
    var MODES = ${JSON.stringify(MODES)};
    var savedMode = localStorage.getItem(MODE_KEY);
    var activeMode = MODES.indexOf(savedMode) !== -1 ? savedMode : MODE_DEFAULT;
    d.dataset.mode = activeMode;
    if (activeMode === 'dark') d.classList.add('dark'); else d.classList.remove('dark');
  } catch (_e) {
    d.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
    d.dataset.mode = ${JSON.stringify(DEFAULT_MODE)};
    if (${JSON.stringify(DEFAULT_MODE)} === 'dark') d.classList.add('dark'); else d.classList.remove('dark');
  }
})();
`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme={DEFAULT_THEME}
      data-mode={DEFAULT_MODE}
      className={`${cairo.variable} ${inter.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className={`min-h-full bg-background text-foreground font-sans font-cairo ${dir === 'rtl' ? 'dir-rtl' : 'dir-ltr'}`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider>
            {children}
            <ThemedToaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
