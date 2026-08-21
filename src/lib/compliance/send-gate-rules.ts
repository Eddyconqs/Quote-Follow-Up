import type { Channel } from "@prisma/client";

export type SendBlockReason =
  | "SENDER_IDENTITY_MISSING"
  | "MISSING_CONTACT"
  | "NO_CONSENT_RECORD"
  | "CONSENT_EXPIRED"
  | "UNSUBSCRIBED";

export type SendGateResult = { allowed: true } | { allowed: false; reason: SendBlockReason };

/**
 * Pure decision function, no I/O — the actual gate logic, checked in a fixed order:
 * sender identity, then contact presence, then suppression, then consent existence,
 * then consent expiry. `assertSendAllowed` in send-gate.ts is a thin DB-fetching
 * wrapper around this.
 */
export function decideSendGate(input: {
  channel: Channel;
  hasSenderIdentity: boolean;
  hasContact: boolean;
  isUnsubscribed: boolean;
  hasConsentRecord: boolean;
  isConsentExpired: boolean;
}): SendGateResult {
  if (input.channel === "EMAIL" && !input.hasSenderIdentity) {
    return { allowed: false, reason: "SENDER_IDENTITY_MISSING" };
  }
  if (!input.hasContact) {
    return { allowed: false, reason: "MISSING_CONTACT" };
  }
  if (input.isUnsubscribed) {
    return { allowed: false, reason: "UNSUBSCRIBED" };
  }
  if (!input.hasConsentRecord) {
    return { allowed: false, reason: "NO_CONSENT_RECORD" };
  }
  if (input.isConsentExpired) {
    return { allowed: false, reason: "CONSENT_EXPIRED" };
  }
  return { allowed: true };
}
