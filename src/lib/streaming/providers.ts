import type { UnifiedTitle, StreamingSource } from "@/types/streaming";

/**
 * Maps user provider_id → Watchmode source_id (US).
 * Used to filter list-titles directly in the API, avoiding per-title enrichment.
 */
export const PROVIDER_TO_SOURCE_ID: Record<string, number> = {
  netflix:      203,
  disney_plus:  372,
  hbo_max:      387,
  amazon_prime:  26,
  apple_tv_plus: 371,
  paramount_plus: 444,
  crunchyroll:   300,
};

/**
 * Maps user provider_id (from DB) to a regex that matches Watchmode providerName strings.
 */
export const PROVIDER_MATCHERS: Record<string, RegExp> = {
  netflix:        /netflix/i,
  disney_plus:    /disney/i,
  hbo_max:        /\b(hbo|max)\b/i,
  amazon_prime:   /\b(prime|amazon)\b/i,
  apple_tv_plus:  /apple/i,
  paramount_plus: /paramount/i,
  crunchyroll:    /crunchyroll/i,
};

/** Returns true if a source's providerName matches any of the user's provider IDs */
export function sourceMatchesProvider(source: StreamingSource, providerIds: string[]): boolean {
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
  userProviderIds: string[]
): UnifiedTitle[] {
  if (userProviderIds.length === 0) return titles;

  return titles
    .map((title) => {
      if (!title.sources?.length) return null; // no sources → skip

      const matchingSubs = title.sources.filter(
        (s) => s.type === "sub" && sourceMatchesProvider(s, userProviderIds)
      );

      if (matchingSubs.length === 0) return null; // not on any user subscription → skip

      // Keep only the user's matched subscription sources
      return { ...title, sources: matchingSubs };
    })
    .filter(Boolean) as UnifiedTitle[];
}
