import { describe, expect, it } from "vitest";
import { openapiDocument } from "../src/lib/openapi/document";
import {
  MAX_INTERACTION_BATCH_SIZE,
  parseTitleIdsParam,
} from "../src/lib/interaction-state";

describe("interaction API contracts", () => {
  it("normalizes duplicate and blank IDs before enforcing the limit", () => {
    const parsed = parseTitleIdsParam(" title-a,,title-a,title-b ");
    expect(parsed).toEqual({ ids: ["title-a", "title-b"] });
  });

  it("keeps the plural and singular membership contracts documented", () => {
    const paths = openapiDocument.paths as Record<string, unknown>;
    expect(paths["/api/lists/items"]).toBeDefined();
    expect(paths["/api/watch-status"]).toBeDefined();
    expect(paths["/api/lists/{listId}/items"]).toBeDefined();
  });

  it("uses the same maximum as the route implementation", () => {
    const ids = Array.from(
      { length: MAX_INTERACTION_BATCH_SIZE + 1 },
      (_, index) => `title-${index}`,
    );
    expect(parseTitleIdsParam(ids.join(",")).error).toContain(
      String(MAX_INTERACTION_BATCH_SIZE),
    );
  });
});
