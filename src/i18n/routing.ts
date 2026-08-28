import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import {
  defaultLocale,
  isAppLocale,
  localizedPath,
  locales,
  type AppLocale,
} from "./locale";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

export { defaultLocale, isAppLocale, localizedPath, locales };
export type { AppLocale };
