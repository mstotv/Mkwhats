import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const SUPPORTED_LOCALES = ['ar', 'en'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'ar';

export default getRequestConfig(async () => {
  let locale: SupportedLocale = DEFAULT_LOCALE;

  try {
    // 1. Try reading from NEXT_LOCALE cookie
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as SupportedLocale)) {
      locale = cookieLocale as SupportedLocale;
    } else {
      // 2. Try reading from env variable
      const envLocale = process.env.NEXT_PUBLIC_APP_LOCALE;
      if (envLocale && SUPPORTED_LOCALES.includes(envLocale as SupportedLocale)) {
        locale = envLocale as SupportedLocale;
      }
    }
  } catch {
    // Fallback if cookies/headers fail in static generation context
  }

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../messages/ar.json`)).default;
  }

  return {
    locale,
    messages,
  };
});
