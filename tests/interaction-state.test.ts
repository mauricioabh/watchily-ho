import { describe, expect, it } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  canonicalTitleIds,
  chunkTitleIds,
  mergeMembershipMaps,
  normalizeTitleIds,
  parseTitleIdsParam,
  updateTitleMembership,
  updateTitleStatus,
} from "../src/lib/interaction-state";
import {
  queryKeys,
  updateMembershipCaches,
  updateWatchStatusCaches,
} from "../src/lib/query";

describe("interaction state helpers", () => {
  it("normalizes and deduplicates title IDs", () => {
    expect(
      normalizeTitleIds([" title-a ", "", null, "title-a", "title-b"]),
    ).toEqual(["title-a", "title-b"]);
    expect(canonicalTitleIds(["title-b", "title-a", "title-b"])).toEqual([
      "title-a",
      "title-b",
    ]);
  });

  it("chunks IDs at the requested boundary", () => {
    expect(chunkTitleIds(["a", "b", "c"], 2)).toEqual([["a", "b"], ["c"]]);
    expect(() => chunkTitleIds(["a"], 0)).toThrow();
  });

  it("accepts 100 unique IDs and rejects the next one", () => {
    const ids = Array.from({ length: 100 }, (_, index) => `title-${index}`);
    expect(parseTitleIdsParam(ids.join(",")).error).toBeUndefined();
    expect(parseTitleIdsParam(`${ids.join(",")},title-100`).error).toContain(
      "100",
    );
  });

  it("merges memberships without duplicating list IDs", () => {
    expect(
      mergeMembershipMaps(
        { "title-a": ["list-1"] },
        { "title-a": ["list-1", "list-2"], "title-b": ["list-3"] },
      ),
    ).toEqual({
      "title-a": ["list-1", "list-2"],
      "title-b": ["list-3"],
    });
  });

  it("updates only the requested title", () => {
    expect(
      updateTitleStatus({ a: "watching", b: "finished" }, "a", null),
    ).toEqual({
      b: "finished",
    });
    expect(
      updateTitleMembership(
        { a: ["list-1"], b: ["list-2"] },
        "a",
        "list-3",
        "add",
      ),
    ).toEqual({
      a: ["list-1", "list-3"],
      b: ["list-2"],
    });
  });

  it("canonicalizes batch cache keys and isolates users", () => {
    expect(queryKeys.watchStatusBatch(["b", "a"], "user-a")).toEqual(
      queryKeys.watchStatusBatch(["a", "b"], "user-a"),
    );
    expect(queryKeys.watchStatusBatch(["a"], "user-a")).not.toEqual(
      queryKeys.watchStatusBatch(["a"], "user-b"),
    );
  });

  it("updates every matching cache entry without touching another title or user", () => {
    const client = new QueryClient();
    client.setQueryData(queryKeys.watchStatusBatch(["a", "b"], "user-a"), {
      statuses: { a: "watching", b: "finished" },
    });
    client.setQueryData(queryKeys.watchStatus("a", "user-a"), {
      statuses: { a: "watching" },
    });
    client.setQueryData(queryKeys.watchStatusBatch(["a"], "user-b"), {
      statuses: { a: "watching" },
    });
    updateWatchStatusCaches(client, "user-a", "a", "finished");
    expect(
      client.getQueryData(queryKeys.watchStatusBatch(["a", "b"], "user-a")),
    ).toEqual({ statuses: { a: "finished", b: "finished" } });
    expect(
      client.getQueryData(queryKeys.watchStatusBatch(["a"], "user-b")),
    ).toEqual({ statuses: { a: "watching" } });

    client.setQueryData(queryKeys.membershipBatch(["a", "b"], "user-a"), {
      listIdsByTitle: { a: ["list-1"], b: ["list-2"] },
    });
    updateMembershipCaches(client, "user-a", "a", "list-3", "add");
    expect(
      client.getQueryData(queryKeys.membershipBatch(["a", "b"], "user-a")),
    ).toEqual({
      listIdsByTitle: { a: ["list-1", "list-3"], b: ["list-2"] },
    });
  });
});
