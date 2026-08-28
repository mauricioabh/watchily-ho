import { describe, expect, it } from "vitest";
import { isAppLocale, localizedPath, locales } from "@/i18n/locale";

describe("localization routing", () => {
  it("keeps English URLs unprefixed", () => {
    expect(localizedPath("/search?q=matrix", "en")).toBe("/search?q=matrix");
  });

  it("prefixes Spanish URLs without changing route data", () => {
    expect(localizedPath("/title/123?region=MX", "es")).toBe(
      "/es/title/123?region=MX",
    );
  });

  it("accepts only supported locales", () => {
    expect(locales).toEqual(["en", "es"]);
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("es")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
  });
});
