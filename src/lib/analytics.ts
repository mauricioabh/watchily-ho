import posthog from "posthog-js";
import { env } from "@/env";

export const ANALYTICS_APP_TAG = "app:wat" as const;

export type AnalyticsEvent =
  | "auth_completed"
  | "search_submitted"
  | "title_viewed"
  | "streaming_link_clicked"
  | "list_membership_changed"
  | "watch_status_changed"
  | "library_filter_changed"
  | "settings_saved";

type AnalyticsProperties = Record<string, unknown>;

type EventProperties = {
  auth_completed: { method: "email" | "google"; flow: "sign_in" | "sign_up" };
  search_submitted: {
    queryLength: number;
    type: "movie" | "series" | "all";
    providerCount: number;
  };
  title_viewed: { titleType: "movie" | "series" };
  streaming_link_clicked: {
    provider: string;
    offerType: "sub" | "rent" | "buy" | "free" | "unknown";
  };
  list_membership_changed: {
    action: "add" | "remove";
    titleType: "movie" | "series";
  };
  watch_status_changed: {
    status: "watching" | "finished" | "removed";
  };
  library_filter_changed: {
    filter: "status" | "type" | "sort" | "provider";
    value: string;
  };
  settings_saved: { country: string; providerCount: number };
};

let initialized = false;
let identifiedUserId: string | null = null;

export function isPostHogConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && env.NEXT_PUBLIC_POSTHOG_HOST,
  );
}

export function initializePostHog(): boolean {
  if (typeof window === "undefined" || !isPostHogConfigured()) return false;

  if (!initialized) {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: env.NEXT_PUBLIC_POSTHOG_HOST!,
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
    });
    initialized = true;
  }

  return true;
}

function boundedCount(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.round(value), 0), max);
}

function boundedProvider(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
  return normalized.slice(0, 40) || "unknown";
}

function boundedCountry(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(normalized) ? normalized : "unknown";
}

function boundedValue(value: unknown): string {
  if (typeof value !== "string") return "unknown";
  return value.trim().slice(0, 40) || "unknown";
}

function getSurface(): "web" | "tv" {
  return typeof window !== "undefined" &&
    (window.location.pathname === "/tv" ||
      window.location.pathname.startsWith("/tv/"))
    ? "tv"
    : "web";
}

/**
 * Builds the only property shape allowed to reach PostHog.
 * The event-specific allowlist intentionally drops unknown and sensitive keys.
 */
export function buildAnalyticsPayload(
  event: AnalyticsEvent,
  properties: AnalyticsProperties = {},
  surface: "web" | "tv" = "web",
): Record<string, string | number> {
  const base = { app_tag: ANALYTICS_APP_TAG, surface };

  switch (event) {
    case "auth_completed":
      return {
        ...base,
        method: properties.method === "google" ? "google" : "email",
        flow: properties.flow === "sign_up" ? "sign_up" : "sign_in",
      };
    case "search_submitted":
      return {
        ...base,
        query_length: boundedCount(properties.queryLength, 200),
        type:
          properties.type === "movie" || properties.type === "series"
            ? properties.type
            : "all",
        provider_count: boundedCount(properties.providerCount, 20),
      };
    case "title_viewed":
      return {
        ...base,
        title_type: properties.titleType === "series" ? "series" : "movie",
      };
    case "streaming_link_clicked":
      return {
        ...base,
        provider: boundedProvider(properties.provider),
        offer_type:
          properties.offerType === "sub" ||
          properties.offerType === "rent" ||
          properties.offerType === "buy" ||
          properties.offerType === "free"
            ? properties.offerType
            : "unknown",
      };
    case "list_membership_changed":
      return {
        ...base,
        action: properties.action === "remove" ? "remove" : "add",
        title_type: properties.titleType === "series" ? "series" : "movie",
      };
    case "watch_status_changed":
      return {
        ...base,
        status:
          properties.status === "watching" || properties.status === "finished"
            ? properties.status
            : "removed",
      };
    case "library_filter_changed":
      return {
        ...base,
        filter:
          properties.filter === "status" ||
          properties.filter === "type" ||
          properties.filter === "sort"
            ? properties.filter
            : "provider",
        value: boundedValue(properties.value),
      };
    case "settings_saved":
      return {
        ...base,
        country: boundedCountry(properties.country),
        provider_count: boundedCount(properties.providerCount, 20),
      };
    default: {
      const exhaustiveEvent: never = event;
      return exhaustiveEvent;
    }
  }
}

export function captureProductEvent<T extends AnalyticsEvent>(
  event: T,
  properties: EventProperties[T],
): void {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture(
    event,
    buildAnalyticsPayload(event, properties, getSurface()),
  );
}

export function syncPostHogIdentity(userId: string | null): void {
  if (typeof window === "undefined" || !initialized) return;

  if (!userId) {
    if (identifiedUserId !== null) {
      posthog.reset();
      identifiedUserId = null;
    }
    return;
  }

  if (identifiedUserId === userId) return;
  if (identifiedUserId !== null) posthog.reset();
  posthog.identify(userId);
  identifiedUserId = userId;
}

export type { EventProperties };
