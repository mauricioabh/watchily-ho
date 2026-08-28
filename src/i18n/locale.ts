export const locales = ["en", "es"] as const;
export const defaultLocale = "en" as const;

export type AppLocale = (typeof locales)[number];

export function isAppLocale(value: string | undefined): value is AppLocale {
  return value != null && locales.includes(value as AppLocale);
}

export function localizedPath(
  pathname: string,
  locale: AppLocale | string,
): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (locale === defaultLocale) return normalized;
  return normalized === "/" ? `/${locale}` : `/${locale}${normalized}`;
}
