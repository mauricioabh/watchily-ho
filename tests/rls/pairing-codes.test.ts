import { afterEach, describe, expect, it } from "vitest";
import {
  anonClient,
  createTestUser,
  deleteTestUser,
  expectNoRowAccess,
  serviceClient,
} from "./helpers";

const createdUserIds: string[] = [];

afterEach(async () => {
  while (createdUserIds.length > 0) {
    const id = createdUserIds.pop();
    if (id) {
      await deleteTestUser(id);
    }
  }
});

describe("pairing_codes RLS", () => {
  it("anon cannot SELECT pairing_codes", async () => {
    const code = `PAIR-${crypto.randomUUID().slice(0, 8)}`;
    const admin = serviceClient();
    await admin.from("pairing_codes").insert({ code });

    const result = await anonClient()
      .from("pairing_codes")
      .select("code")
      .eq("code", code);

    expectNoRowAccess(result);
  });

  it("authenticated user cannot SELECT pairing_codes", async () => {
    const user = await createTestUser("pairing-auth");
    createdUserIds.push(user.id);

    const code = `PAIR-${crypto.randomUUID().slice(0, 8)}`;
    await serviceClient().from("pairing_codes").insert({ code });

    const result = await user.client
      .from("pairing_codes")
      .select("code")
      .eq("code", code);

    expectNoRowAccess(result);
  });
});
