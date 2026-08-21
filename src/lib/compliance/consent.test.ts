import { describe, it, expect } from "vitest";
import { isConsentExpired, IMPLIED_CONSENT_EXPIRY_MS } from "./consent-rules";

const NOW = new Date("2026-01-01T00:00:00.000Z");
const under2y = new Date(NOW.getTime() - (IMPLIED_CONSENT_EXPIRY_MS - 1000));
const over2y = new Date(NOW.getTime() - (IMPLIED_CONSENT_EXPIRY_MS + 1000));

describe("isConsentExpired", () => {
  it("is not expired just under the 2-year window for an implied source", () => {
    expect(isConsentExpired("QUOTE_REQUEST", under2y, null, NOW)).toBe(false);
  });

  it("is expired just over the 2-year window for an implied source", () => {
    expect(isConsentExpired("QUOTE_REQUEST", over2y, null, NOW)).toBe(true);
  });

  it("measures from the last interaction, not the original consent date, when both exist", () => {
    const veryOldConsent = new Date(NOW.getTime() - IMPLIED_CONSENT_EXPIRY_MS * 5);
    const recentInteraction = new Date(NOW.getTime() - 1000);
    expect(isConsentExpired("QUOTE_REQUEST", veryOldConsent, recentInteraction, NOW)).toBe(false);
  });

  it("falls back to the consent date when there has been no interaction since", () => {
    expect(isConsentExpired("EXISTING_BUSINESS_RELATIONSHIP", over2y, null, NOW)).toBe(true);
  });

  it("treats IMPORTED as an implied source subject to expiry", () => {
    expect(isConsentExpired("IMPORTED", over2y, null, NOW)).toBe(true);
  });

  it("never expires EXPRESS_OPT_IN consent, however old", () => {
    const ancient = new Date(NOW.getTime() - IMPLIED_CONSENT_EXPIRY_MS * 50);
    expect(isConsentExpired("EXPRESS_OPT_IN", ancient, null, NOW)).toBe(false);
  });
});
