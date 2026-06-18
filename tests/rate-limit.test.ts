import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  isUpstashConfigured,
  rateLimitTitleSearch,
} from "../src/lib/rate-limit";
import { loadEnvLocal } from "./setup/load-env-local";

loadEnvLocal();

const SEARCH_LIMIT_PER_MIN = 20;

test(
  "title search allows requests under the sliding window then blocks",
  { skip: !isUpstashConfigured() },
  async () => {
    const userId = `rate-limit-qa-${randomUUID()}`;

    for (let i = 0; i < SEARCH_LIMIT_PER_MIN; i++) {
      const result = await rateLimitTitleSearch(userId);
      assert.equal(result.limited, false, `request ${i + 1} should pass`);
    }

    const blocked = await rateLimitTitleSearch(userId);
    assert.equal(blocked.limited, true);
    if (blocked.limited) {
      assert.ok(blocked.retryAfterSec > 0);
    }
  },
);

test("reports whether Upstash REST credentials are set", () => {
  assert.equal(typeof isUpstashConfigured(), "boolean");
});
