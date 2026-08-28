import { describe, expect, it } from "vitest";
import {
  libraryParsers,
  normalizeSearchProviders,
  searchParsers,
} from "../src/lib/url-state";
import {
  clearUserScopedCache,
  createQueryClient,
  queryKeys,
} from "../src/lib/query";

describe("URL state contracts", () => {
  it("uses safe search defaults and rejects invalid provider ids", () => {
    expect(searchParsers.type.parse("invalid")).toBeNull();
    expect(libraryParsers.status.parse("invalid")).toBeNull();
    expect(
      normalizeSearchProviders(
        ["netflix", "unknown", "netflix"],
        ["netflix", "disney_plus"],
      ),
    ).toEqual(["netflix"]);
  });

  it("keeps response-affecting query inputs in distinct keys", () => {
    const base = {
      country: "MX",
      pageSize: 16,
      providerIds: ["netflix"],
      type: "all" as const,
      userId: "user-a",
    };
    expect(queryKeys.popular(base)).not.toEqual(
      queryKeys.popular({ ...base, country: "US" }),
    );
    expect(queryKeys.popular(base)).not.toEqual(
      queryKeys.popular({ ...base, userId: "user-b" }),
    );
    expect(queryKeys.search({ ...base, query: "Dune" })).not.toEqual(
      queryKeys.search({ ...base, query: "Alien" }),
    );
  });

  it("invalidates affected list data after a mutation", async () => {
    const queryClient = createQueryClient();
    const key = queryKeys.lists("user-a");
    queryClient.setQueryData(key, { lists: [] });

    await queryClient.invalidateQueries({ queryKey: ["lists"] });

    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
  });

  it("clears user-scoped cache when the auth identity changes", () => {
    const queryClient = createQueryClient();
    queryClient.setQueryData(queryKeys.likes("title-1", "user-a"), {
      likedIds: ["title-1"],
    });
    queryClient.setQueryData(queryKeys.title("title-1", "MX"), {
      id: "title-1",
    });

    clearUserScopedCache(queryClient);

    expect(queryClient.getQueryData(queryKeys.likes("title-1", "user-a"))).toBe(
      undefined,
    );
    expect(queryClient.getQueryData(queryKeys.title("title-1", "MX"))).toEqual({
      id: "title-1",
    });
  });
});
