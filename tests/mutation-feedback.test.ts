import { describe, expect, it } from "vitest";
import {
  getMutationErrorMessage,
  requireSuccessfulResponse,
} from "../src/lib/mutation-feedback";

describe("mutation feedback", () => {
  it("accepts any successful 2xx response", async () => {
    const response = new Response(null, { status: 204 });

    await expect(requireSuccessfulResponse(response, "fallback")).resolves.toBe(
      response,
    );
  });

  it("rejects non-2xx responses and uses the API error when available", async () => {
    const response = new Response(JSON.stringify({ error: "Not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });

    await expect(
      requireSuccessfulResponse(response, "fallback"),
    ).rejects.toThrow("Not allowed");
  });

  it("preserves a useful fallback for network errors", () => {
    expect(
      getMutationErrorMessage(new TypeError("Failed to fetch"), "Try again"),
    ).toBe("Failed to fetch");
    expect(getMutationErrorMessage("unknown", "Try again")).toBe("Try again");
  });
});
