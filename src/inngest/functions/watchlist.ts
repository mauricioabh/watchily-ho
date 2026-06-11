import { inngest } from "@/inngest/client";
import { refreshTitleAvailabilityCache } from "@/lib/watchlist-refresh";

/** Refresh one title after add-to-list (event-driven). */
export const watchlistItemAdded = inngest.createFunction(
  { id: "watchlist-item-added", name: "Watchlist — refresh title" },
  { event: "watchlist/item.added" },
  async ({ event, step }) => {
    const { titleId, countryCode } = event.data;
    return step.run("refresh-title", () =>
      refreshTitleAvailabilityCache(titleId, countryCode),
    );
  },
);

/** Daily batch refresh for cached titles (structure stub — extend with stale query). */
export const watchlistRefreshCron = inngest.createFunction(
  { id: "watchlist-refresh-cron", name: "Watchlist — daily refresh" },
  { cron: "0 4 * * *" },
  async ({ step }) => {
    const items = await step.run("load-stale-titles", async () => {
      const { createAdminClient } = await import("@/lib/supabase/server");
      const admin = createAdminClient();
      const { data: rows, error } = await admin
        .from("title_availability_cache")
        .select("title_id, country_code")
        .order("refreshed_at", { ascending: true })
        .limit(50);
      if (error) {
        throw new Error(error.message);
      }
      return rows ?? [];
    });

    if (items.length === 0) {
      return { refreshed: 0, note: "no cached titles yet" };
    }

    let ok = 0;
    for (const row of items) {
      const result = await step.run(`refresh-${row.title_id}`, () =>
        refreshTitleAvailabilityCache(row.title_id, row.country_code ?? "MX"),
      );
      if (result.ok) ok += 1;
    }

    return { refreshed: ok, total: items.length };
  },
);

export const watchlistRefreshBatch = inngest.createFunction(
  { id: "watchlist-refresh-batch", name: "Watchlist — batch refresh" },
  { event: "watchlist/refresh.batch" },
  async ({ event, step }) => {
    const { titleIds, countryCode } = event.data;
    let ok = 0;
    for (const titleId of titleIds) {
      const result = await step.run(`refresh-${titleId}`, () =>
        refreshTitleAvailabilityCache(titleId, countryCode),
      );
      if (result.ok) ok += 1;
    }
    return { ok, total: titleIds.length };
  },
);

export const functions = [
  watchlistItemAdded,
  watchlistRefreshCron,
  watchlistRefreshBatch,
];
