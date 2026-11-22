import { beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
// Like the real client, rpc only works when called on the client object.
vi.mock("@/integrations/supabase/client", () => {
  const supabase = {
    rest: {},
    rpc(this: { rest?: unknown }, ...a: unknown[]) {
      if (!this?.rest) throw new TypeError("undefined is not an object (evaluating 'this.rest')");
      return rpc(...a);
    },
  };
  return { supabase };
});

import { isHiddenUser, isUserBlockedError, useBlockStore } from "./blockStore";

describe("blockStore", () => {
  beforeEach(() => {
    rpc.mockReset();
    useBlockStore.setState({ hiddenIds: new Set(), loadedFor: null, pending: null });
  });

  it("loads hidden ids for the signed-in user", async () => {
    rpc.mockResolvedValueOnce({ data: ["a", "b"], error: null });
    await useBlockStore.getState().load("me");
    expect(rpc).toHaveBeenCalledWith("get_hidden_user_ids");
    expect(isHiddenUser("a")).toBe(true);
    expect(isHiddenUser("c")).toBe(false);
  });

  it("clears everything when signed out", async () => {
    useBlockStore.setState({ hiddenIds: new Set(["a"]), loadedFor: "me" });
    await useBlockStore.getState().load(null);
    expect(isHiddenUser("a")).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("hides a user right after blocking", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    await useBlockStore.getState().block("x");
    expect(rpc).toHaveBeenCalledWith("block_user", { p_user_id: "x" });
    expect(isHiddenUser("x")).toBe(true);
  });

  it("keeps the state when blocking fails", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "nope" } });
    await expect(useBlockStore.getState().block("x")).rejects.toThrow("nope");
    expect(isHiddenUser("x")).toBe(false);
  });

  it("reloads after unblocking (they may still have blocked me)", async () => {
    useBlockStore.setState({ hiddenIds: new Set(["x"]), loadedFor: "me" });
    rpc
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    await useBlockStore.getState().unblock("x");
    expect(rpc).toHaveBeenNthCalledWith(1, "unblock_user", { p_user_id: "x" });
    expect(rpc).toHaveBeenNthCalledWith(2, "get_hidden_user_ids");
    expect(isHiddenUser("x")).toBe(false);
  });

  it("recognises the database's blocked error", () => {
    expect(isUserBlockedError({ message: "user_blocked" })).toBe(true);
    expect(isUserBlockedError(new Error("something else"))).toBe(false);
    expect(isUserBlockedError(null)).toBe(false);
  });
});
