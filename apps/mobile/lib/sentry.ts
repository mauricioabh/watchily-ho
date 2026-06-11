import * as Sentry from "@sentry/react-native";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim();

export function initSentry(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: __DEV__ ? "development" : "production",
    tracesSampleRate: __DEV__ ? 1 : 0.1,
    initialScope: {
      tags: { platform: "mobile" },
    },
    beforeSend(event) {
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          if (crumb.data && typeof crumb.data === "object") {
            for (const key of Object.keys(crumb.data)) {
              if (/authorization|token|password|email/i.test(key)) {
                crumb.data[key] = "[REDACTED]";
              }
            }
          }
        }
      }
      return event;
    },
  });
}

export { Sentry };
