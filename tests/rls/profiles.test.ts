import { afterEach, describe, expect, it } from "vitest";
import {
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

describe("profiles RLS", () => {
  it("user can read own profile", async () => {
    const user = await createTestUser("profiles-own");
    createdUserIds.push(user.id);

    const { data, error } = await user.client
      .from("profiles")
      .select("id, email")
      .eq("id", user.id)
      .single();

    expect(error).toBeNull();
    expect(data?.id).toBe(user.id);
  });

  it("user cannot read another user profile", async () => {
    const userA = await createTestUser("profiles-a");
    const userB = await createTestUser("profiles-b");
    createdUserIds.push(userA.id, userB.id);

    const result = await userA.client
      .from("profiles")
      .select("id")
      .eq("id", userB.id);

    expectNoRowAccess(result);
  });

  it("user cannot update another user profile", async () => {
    const userA = await createTestUser("profiles-upd-a");
    const userB = await createTestUser("profiles-upd-b");
    createdUserIds.push(userA.id, userB.id);

    const { error } = await userA.client
      .from("profiles")
      .update({ display_name: "hacked" })
      .eq("id", userB.id);

    expect(error).not.toBeNull();

    const { data: profile } = await serviceClient()
      .from("profiles")
      .select("display_name")
      .eq("id", userB.id)
      .single();

    expect(profile?.display_name).not.toBe("hacked");
  });
});
