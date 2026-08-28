import { parseAsArrayOf, parseAsString, parseAsStringLiteral } from "nuqs";

export const searchParsers = {
  q: parseAsString.withDefault(""),
  type: parseAsStringLiteral(["all", "movie", "series"] as const).withDefault(
    "all",
  ),
  providers: parseAsArrayOf(parseAsString),
};

export type SearchUrlState = {
  q: string;
  type: "all" | "movie" | "series";
  providers: string[] | null;
};

export function normalizeSearchProviders(
  providers: readonly string[] | null | undefined,
  allowedProviders: readonly string[],
): string[] {
  if (!providers) return [];
  const allowed = new Set(allowedProviders);
  return [
    ...new Set(providers.filter((provider) => allowed.has(provider))),
  ].sort();
}

export const libraryParsers = {
  query: parseAsString.withDefault(""),
  type: parseAsStringLiteral(["all", "movie", "series"] as const).withDefault(
    "all",
  ),
  status: parseAsStringLiteral([
    "all",
    "watching",
    "finished",
  ] as const).withDefault("all"),
  sort: parseAsStringLiteral(["custom", "asc", "desc"] as const).withDefault(
    "custom",
  ),
};

export function hasUrlParam(
  searchParams: { has(name: string): boolean },
  key: keyof typeof libraryParsers,
): boolean {
  return searchParams.has(key);
}
