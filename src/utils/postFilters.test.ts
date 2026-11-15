import { describe, expect, it } from "vitest";
import { applyPostFilters } from "./postFilters";
import type { Post } from "@/types/post";

const post = (id: number, user_id = "owner") =>
  ({ id: String(id), user_id, item_type: "offer" } as unknown as Post);
const posts = [post(1), post(2), post(3, "me")];
const base = { categories: [], conditions: [], itemTypes: [], onlyInterested: false, currentUserId: "me" };

describe("applyPostFilters: onlySaved", () => {
  it("keeps only saved posts", () => {
    const out = applyPostFilters(posts, { ...base, onlySaved: true }, new Set(), new Set(["2"]));
    expect(out.map((p) => p.id)).toEqual(["2"]);
  });

  it("is ignored without savedIds (the map)", () => {
    const out = applyPostFilters(posts, { ...base, onlySaved: true }, new Set());
    expect(out).toHaveLength(3);
  });

  it("does nothing when off", () => {
    const out = applyPostFilters(posts, base, new Set(), new Set(["2"]));
    expect(out).toHaveLength(3);
  });
});
