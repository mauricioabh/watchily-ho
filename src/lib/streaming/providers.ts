import type { UnifiedTitle, StreamingSource } from "@/types/streaming";
import { getProviderMeta } from "./provider-meta";

/**
 * Maps user provider_id → Watchmode source_id (US).
 * Used to filter list-titles directly in the API, avoiding per-title enrichment.
 */
export const PROVIDER_TO_SOURCE_ID: Record<string, number> = {
  netflix: 203,
  disney_plus: 372,
  hbo_max: 387,
  amazon_prime: 26,
  apple_tv_plus: 371,
  paramount_plus: 444,
  crunchyroll: 300,
};

/**
 * Maps user provider_id (from DB) to a regex that matches Watchmode providerName strings.
 */
export const PROVIDER_MATCHERS: Record<string, RegExp> = {
  netflix: /netflix/i,
  disney_plus: /disney/i,
  hbo_max: /\b(hbo|max)\b/i,
  amazon_prime: /\b(prime|amazon)\b/i,
  apple_tv_plus: /apple/i,
  paramount_plus: /paramount/i,
  crunchyroll: /crunchyroll/i,
};

/** Brand match order: content brands before hosts that appear in "(via …)" clauses. */
const CANONICAL_MATCH_ORDER = [
  "netflix",
  "disney_plus",
  "hbo_max",
  "amazon_prime",
  "apple_tv_plus",
  "paramount_plus",
  "crunchyroll",
] as const;

const VIA_HOST_RE = /\(\s*via\b/i;

/** Text before "(via …)" so channel hosts do not steal the brand match. */
function brandNameForMatch(providerName: string): string {
  const viaIdx = providerName.search(VIA_HOST_RE);
  if (viaIdx >= 0) {
    const brand = providerName.slice(0, viaIdx).trim();
    return brand || providerName;
  }
  return providerName;
}

export function isViaChannelSource(providerName: string): boolean {
  return VIA_HOST_RE.test(providerName);
}

/**
 * Resolve a Watchmode provider name to a canonical brand id
 * (e.g. "MAX (via Amazon Prime)" → "hbo_max").
 */
export function canonicalProviderId(providerName: string): string {
  const brandPart = brandNameForMatch(providerName);
  for (const id of CANONICAL_MATCH_ORDER) {
    const matcher = PROVIDER_MATCHERS[id];
    if (matcher?.test(brandPart)) return id;
  }
  for (const id of CANONICAL_MATCH_ORDER) {
    const matcher = PROVIDER_MATCHERS[id];
    if (matcher?.test(providerName)) return id;
  }
  return providerName.toLowerCase().replace(/\s+/g, "");
}

/** Display label for a source: canonical brand name when known. */
export function displayProviderName(providerName: string): string {
  const id = canonicalProviderId(providerName);
  return getProviderMeta(id)?.name ?? providerName;
}

/**
 * Collapse sources that share the same canonical brand + type.
 * Prefers native (non-"via") rows when choosing which URL/name to keep.
 */
export function dedupeSourcesByBrand(
  sources: StreamingSource[],
): StreamingSource[] {
  const bestByKey = new Map<string, StreamingSource>();

  for (const source of sources) {
    const key = `${canonicalProviderId(source.providerName)}:${source.type}`;
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, source);
      continue;
    }
    if (
      isViaChannelSource(existing.providerName) &&
      !isViaChannelSource(source.providerName)
    ) {
      bestByKey.set(key, source);
    }
  }

  const seen = new Set<string>();
  const result: StreamingSource[] = [];
  for (const source of sources) {
    const key = `${canonicalProviderId(source.providerName)}:${source.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const kept = bestByKey.get(key);
    if (kept) result.push(kept);
  }
  return result;
}

/** Subscription-only sources, one per canonical brand. */
export function dedupeSubscriptionSourcesByBrand(
  sources: StreamingSource[],
): StreamingSource[] {
  return dedupeSourcesByBrand(sources.filter((s) => s.type === "sub"));
}

/** Returns true if a source's providerName matches any of the user's provider IDs */
export function sourceMatchesProvider(
  source: StreamingSource,
  providerIds: string[],
): boolean {
  return providerIds.some((id) => {
    const matcher = PROVIDER_MATCHERS[id];
    return matcher ? matcher.test(source.providerName) : false;
  });
}

/**
 * Given a list of titles with sources, filters and trims each title so that:
 * - `sources` only contains subscription sources from the user's providers
 * - Titles with no matching subscription source are removed entirely
 *
 * If the user has no providers configured, returns all titles unchanged.
 */
export function filterTitlesByUserProviders(
  titles: UnifiedTitle[],
  userProviderIds: string[],
): UnifiedTitle[] {
  if (userProviderIds.length === 0) return titles;

  return titles
    .map((title) => {
      if (!title.sources?.length) return null; // no sources → skip

      const matchingSubs = title.sources.filter(
        (s) => s.type === "sub" && sourceMatchesProvider(s, userProviderIds),
      );

      if (matchingSubs.length === 0) return null; // not on any user subscription → skip

      // Keep only the user's matched subscription sources
      return { ...title, sources: matchingSubs };
    })
    .filter(Boolean) as UnifiedTitle[];
}
