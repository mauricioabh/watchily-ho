import { afterEach, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, serviceClient } from "./helpers";

const createdUserIds: string[] = [];

afterEach(async () => {
  while (createdUserIds.length > 0) {
    const id = createdUserIds.pop();
    if (id) {
      await deleteTestUser(id);
    }
  }
});

describe("likes RLS", () => {
  it("user A cannot DELETE user B like", async () => {
    const userA = await createTestUser("likes-del-a");
    const userB = await createTestUser("likes-del-b");
    createdUserIds.push(userA.id, userB.id);

    const titleId = `title-${crypto.randomUUID()}`;
    const admin = serviceClient();
    const { error: seedError } = await admin.from("likes").insert({
      user_id: userB.id,
      title_id: titleId,
      title_type: "movie",
    });
    expect(seedError).toBeNull();

    const { error } = await userA.client
      .from("likes")
      .delete()
      .eq("user_id", userB.id)
      .eq("title_id", titleId);

    expect(error).not.toBeNull();

    const { data: stillLiked } = await admin
      .from("likes")
      .select("user_id")
      .eq("user_id", userB.id)
      .eq("title_id", titleId)
      .single();
    expect(stillLiked?.user_id).toBe(userB.id);
  });

  it("user A cannot INSERT a like for user B", async () => {
    const userA = await createTestUser("likes-ins-a");
    const userB = await createTestUser("likes-ins-b");
    createdUserIds.push(userA.id, userB.id);

    const { error } = await userA.client.from("likes").insert({
      user_id: userB.id,
      title_id: "tm999",
      title_type: "series",
    });

    expect(error).not.toBeNull();
  });
});
