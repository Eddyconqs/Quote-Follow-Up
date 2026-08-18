import { describe, it, expect } from "vitest";
import { nextValidSendTime, computeStepSendTime, DEFAULT_BUSINESS_HOURS, parseBusinessHours } from "./business-hours";

const TZ = "America/Toronto";

describe("nextValidSendTime", () => {
  it("returns the same instant when already inside business hours on a business day", () => {
    // 2024-06-11 is a Tuesday. 14:00 America/Toronto (UTC-4 in June) = 18:00 UTC.
    const candidate = new Date("2024-06-11T18:00:00.000Z");
    const result = nextValidSendTime(candidate, TZ, DEFAULT_BUSINESS_HOURS);
    expect(result.getTime()).toBe(candidate.getTime());
  });

  it("pushes forward to opening time when before business hours on a business day", () => {
    // 06:00 America/Toronto = 10:00 UTC on the same Tuesday.
    const candidate = new Date("2024-06-11T10:00:00.000Z");
    const result = nextValidSendTime(candidate, TZ, DEFAULT_BUSINESS_HOURS);
    expect(result.getTime()).toBeGreaterThan(candidate.getTime());

    const hourInToronto = new Date(result.toLocaleString("en-US", { timeZone: TZ })).getHours();
    expect(hourInToronto).toBe(9);
  });

  it("skips the weekend and lands on Monday morning", () => {
    // 2024-06-15 is a Saturday, 10:00 Toronto.
    const candidate = new Date("2024-06-15T14:00:00.000Z");
    const result = nextValidSendTime(candidate, TZ, DEFAULT_BUSINESS_HOURS);

    const dowInToronto = new Date(result.toLocaleString("en-US", { timeZone: TZ })).getDay();
    expect(dowInToronto).toBe(1); // Monday
    expect(result.getTime()).toBeGreaterThan(candidate.getTime());
  });

  it("never pushes an already-valid time backward", () => {
    const candidate = new Date("2024-06-11T18:30:00.000Z");
    const result = nextValidSendTime(candidate, TZ, DEFAULT_BUSINESS_HOURS);
    expect(result.getTime()).toBeGreaterThanOrEqual(candidate.getTime());
  });
});

describe("computeStepSendTime", () => {
  it("adds the delay before clamping into business hours", () => {
    const from = new Date("2024-06-11T18:00:00.000Z"); // Tuesday, inside hours
    const result = computeStepSendTime(from, 3, TZ, DEFAULT_BUSINESS_HOURS);
    // +3 days lands on Friday, still inside hours, so no additional push expected.
    const dowInToronto = new Date(result.toLocaleString("en-US", { timeZone: TZ })).getDay();
    expect(dowInToronto).toBe(5); // Friday
  });

  it("treats a zero-day delay as immediate (subject to business hours clamping)", () => {
    const from = new Date("2024-06-11T18:00:00.000Z");
    const result = computeStepSendTime(from, 0, TZ, DEFAULT_BUSINESS_HOURS);
    expect(result.getTime()).toBe(from.getTime());
  });
});

describe("parseBusinessHours", () => {
  it("falls back to defaults for malformed input", () => {
    expect(parseBusinessHours(null)).toEqual(DEFAULT_BUSINESS_HOURS);
    expect(parseBusinessHours({})).toEqual(DEFAULT_BUSINESS_HOURS);
    expect(parseBusinessHours("garbage")).toEqual(DEFAULT_BUSINESS_HOURS);
  });

  it("passes through well-formed input", () => {
    const hours = { start: 8, end: 16, days: [1, 2, 3] };
    expect(parseBusinessHours(hours)).toEqual(hours);
  });
});
