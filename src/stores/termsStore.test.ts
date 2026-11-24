import { beforeEach, describe, expect, it } from "vitest";
import { ensureTermsAccepted, useTermsStore } from "./termsStore";

describe("ensureTermsAccepted", () => {
  beforeEach(() => useTermsStore.setState({ status: "unknown", screenOpen: false }));

  it("lets actions through while the status is unknown (never blocks on a failed lookup)", () => {
    expect(ensureTermsAccepted()).toBe(true);
    expect(useTermsStore.getState().screenOpen).toBe(false);
  });

  it("lets actions through once accepted", () => {
    useTermsStore.getState().setStatus("accepted");
    expect(ensureTermsAccepted()).toBe(true);
  });

  it("stops the action and opens the screen when acceptance is required", () => {
    useTermsStore.getState().setStatus("required");
    expect(ensureTermsAccepted()).toBe(false);
    expect(useTermsStore.getState().screenOpen).toBe(true);
  });

  it("accepting closes the screen", () => {
    useTermsStore.setState({ status: "required", screenOpen: true });
    useTermsStore.getState().setStatus("accepted");
    expect(useTermsStore.getState().screenOpen).toBe(false);
  });
});
