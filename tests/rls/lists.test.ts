import { afterEach, describe, expect, it } from "vitest";
import { createTestUser, deleteTestUser, seedList } from "./helpers";

const createdUserIds: string[] = [];

afterEach(async () => {
  while (createdUserIds.length > 0) {
    const id = createdUserIds.pop();
    if (id) {
      await deleteTestUser(id);
    }
  }
});

describe("lists and list_items RLS", () => {
  it("user A cannot UPDATE user B private list", async () => {
    const userA = await createTestUser("lists-upd-a");
    const userB = await createTestUser("lists-upd-b");
    createdUserIds.push(userA.id, userB.id);

    const listBId = await seedList(userB.id, "Private B", false);

    const { error } = await userA.client
      .from("lists")
      .update({ name: "stolen" })
      .eq("id", listBId);

    expect(error).not.toBeNull();

    const { data: unchanged } = await userB.client
      .from("lists")
      .select("name")
      .eq("id", listBId)
      .single();
    expect(unchanged?.name).toBe("Private B");
  });

  it("user C can SELECT user B public list", async () => {
    const userB = await createTestUser("lists-pub-b");
    const userC = await createTestUser("lists-pub-c");
    createdUserIds.push(userB.id, userC.id);

    const publicListId = await seedList(userB.id, "Public B", true);

    const { data, error } = await userC.client
      .from("lists")
      .select("id, name")
      .eq("id", publicListId)
      .single();

    expect(error).toBeNull();
    expect(data?.name).toBe("Public B");
  });

  it("user A cannot INSERT list_items into user B list", async () => {
    const userA = await createTestUser("lists-item-a");
    const userB = await createTestUser("lists-item-b");
    createdUserIds.push(userA.id, userB.id);

    const listBId = await seedList(userB.id, "Items B", false);

    const { error } = await userA.client.from("list_items").insert({
      list_id: listBId,
      title_id: "tm123",
      title_type: "movie",
    });

    expect(error).not.toBeNull();
  });

  it("user A cannot DELETE user B private list", async () => {
    const userA = await createTestUser("lists-del-a");
    const userB = await createTestUser("lists-del-b");
    createdUserIds.push(userA.id, userB.id);

    const listBId = await seedList(userB.id, "Keep B", false);

    const { error } = await userA.client
      .from("lists")
      .delete()
      .eq("id", listBId);

    expect(error).not.toBeNull();

    const { data: stillThere } = await userB.client
      .from("lists")
      .select("id")
      .eq("id", listBId)
      .single();
    expect(stillThere?.id).toBe(listBId);
  });
});
