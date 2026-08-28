import { describe, expect, it } from "vitest";
import { buildAnalyticsPayload } from "../src/lib/analytics";

describe("analytics payloads", () => {
  it("keeps search metadata bounded and excludes raw user input", () => {
    const payload = buildAnalyticsPayload("search_submitted", {
      queryLength: 9999,
      type: "movie",
      providerCount: 999,
      query: "private search text",
      email: "person@example.com",
      password: "secret",
    });

    expect(payload).toEqual({
      app_tag: "app:wat",
      surface: "web",
      query_length: 200,
      type: "movie",
      provider_count: 20,
    });
    expect(JSON.stringify(payload)).not.toContain("private search text");
    expect(JSON.stringify(payload)).not.toContain("person@example.com");
    expect(JSON.stringify(payload)).not.toContain("secret");
  });

  it("normalizes only safe streaming metadata", () => {
    const payload = buildAnalyticsPayload(
      "streaming_link_clicked",
      {
        provider: " Netflix / private-url ",
        offerType: "rent",
        url: "https://provider.example/private",
      },
      "tv",
    );

    expect(payload).toEqual({
      app_tag: "app:wat",
      surface: "tv",
      provider: "netflixprivate-url",
      offer_type: "rent",
    });
    expect(payload).not.toHaveProperty("url");
  });

  it("adds the Watchily context to every supported event", () => {
    const events = [
      "auth_completed",
      "search_submitted",
      "title_viewed",
      "streaming_link_clicked",
      "list_membership_changed",
      "watch_status_changed",
      "library_filter_changed",
      "settings_saved",
    ] as const;

    for (const event of events) {
      expect(buildAnalyticsPayload(event, {}, "web").app_tag).toBe("app:wat");
    }
  });
});
