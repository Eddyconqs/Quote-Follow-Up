import { describe, it, expect } from "vitest";
import { decideSendGate } from "./send-gate-rules";

const ALLOWED_BASE = {
  channel: "EMAIL" as const,
  hasSenderIdentity: true,
  hasContact: true,
  isUnsubscribed: false,
  hasConsentRecord: true,
  isConsentExpired: false,
};

describe("decideSendGate", () => {
  it("allows the happy path", () => {
    expect(decideSendGate(ALLOWED_BASE)).toEqual({ allowed: true });
  });

  it("blocks EMAIL when the company has no sender identity, even with valid consent", () => {
    const result = decideSendGate({ ...ALLOWED_BASE, hasSenderIdentity: false });
    expect(result).toEqual({ allowed: false, reason: "SENDER_IDENTITY_MISSING" });
  });

  it("does not require sender identity for SMS", () => {
    const result = decideSendGate({ ...ALLOWED_BASE, channel: "SMS", hasSenderIdentity: false });
    expect(result.allowed).toBe(true);
  });

  it("blocks when the customer has no email/phone on file", () => {
    const result = decideSendGate({ ...ALLOWED_BASE, hasContact: false });
    expect(result).toEqual({ allowed: false, reason: "MISSING_CONTACT" });
  });

  it("blocks an unsubscribed contact even if a consent record still exists", () => {
    const result = decideSendGate({ ...ALLOWED_BASE, isUnsubscribed: true, hasConsentRecord: true, isConsentExpired: false });
    expect(result).toEqual({ allowed: false, reason: "UNSUBSCRIBED" });
  });

  it("blocks when there is no consent-basis record at all", () => {
    const result = decideSendGate({ ...ALLOWED_BASE, hasConsentRecord: false });
    expect(result).toEqual({ allowed: false, reason: "NO_CONSENT_RECORD" });
  });

  it("blocks when the implied consent has expired", () => {
    const result = decideSendGate({ ...ALLOWED_BASE, isConsentExpired: true });
    expect(result).toEqual({ allowed: false, reason: "CONSENT_EXPIRED" });
  });

  it("checks unsubscribe suppression before consent-record existence", () => {
    // Both problems are present — suppression must win, since it must never be
    // possible to route around an unsubscribe by any other consent state.
    const result = decideSendGate({ ...ALLOWED_BASE, isUnsubscribed: true, hasConsentRecord: false });
    expect(result).toEqual({ allowed: false, reason: "UNSUBSCRIBED" });
  });
});
