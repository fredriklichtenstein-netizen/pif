import { describe, expect, it } from "vitest";
import {
  fromLocalInputValue,
  maxScheduleDate,
  minScheduleDate,
  roundUpToStep,
  toLocalInputValue,
  validateSchedule,
} from "./schedule";

const at = (iso: string) => new Date(iso);

describe("roundUpToStep", () => {
  it("keeps an exact step", () => {
    expect(roundUpToStep(at("2026-11-01T09:05:00Z")).toISOString()).toBe("2026-11-01T09:05:00.000Z");
  });
  it("rounds up to the next 5 minutes", () => {
    expect(roundUpToStep(at("2026-11-01T09:05:01Z")).toISOString()).toBe("2026-11-01T09:10:00.000Z");
  });
});

describe("schedule bounds", () => {
  const now = at("2026-11-01T09:02:30Z");

  it("min is at least 10 minutes ahead, on a step", () => {
    expect(minScheduleDate(now).toISOString()).toBe("2026-11-01T09:15:00.000Z");
  });

  it("max is 30 days ahead, on a step", () => {
    expect(maxScheduleDate(now).toISOString()).toBe("2026-12-01T09:00:00.000Z");
  });

  it("accepts the min and max", () => {
    expect(validateSchedule(minScheduleDate(now), now)).toBeNull();
    expect(validateSchedule(maxScheduleDate(now), now)).toBeNull();
  });

  it("rejects past, too-soon, too-far and invalid dates", () => {
    expect(validateSchedule(at("2026-11-01T08:00:00Z"), now)).toBe("too_soon");
    expect(validateSchedule(at("2026-11-01T09:04:00Z"), now)).toBe("too_soon");
    expect(validateSchedule(at("2026-12-02T09:00:00Z"), now)).toBe("too_far");
    expect(validateSchedule(new Date("nope"), now)).toBe("invalid");
    expect(validateSchedule(null, now)).toBe("invalid");
  });
});

describe("datetime-local round trip", () => {
  it("formats and parses local time", () => {
    const d = new Date(2026, 10, 1, 9, 5);
    expect(toLocalInputValue(d)).toBe("2026-11-01T09:05");
    expect(fromLocalInputValue("2026-11-01T09:05")?.getTime()).toBe(d.getTime());
  });
  it("rejects malformed input", () => {
    expect(fromLocalInputValue("")).toBeNull();
    expect(fromLocalInputValue("2026-11-01 09:05")).toBeNull();
  });
});
