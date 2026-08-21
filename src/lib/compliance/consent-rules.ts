import type { ConsentSource } from "@prisma/client";

export const IMPLIED_CONSENT_EXPIRY_MS = 2 * 365 * 24 * 60 * 60 * 1000; // ~2 years, CASL implied-consent window

export const IMPLIED_CONSENT_SOURCES: ConsentSource[] = ["QUOTE_REQUEST", "EXISTING_BUSINESS_RELATIONSHIP", "IMPORTED"];

/**
 * Pure decision function, no I/O: does this consent source/date/last-interaction
 * combination count as expired right now? Implied-consent sources expire ~2 years
 * after the last interaction (CASL); EXPRESS_OPT_IN never expires on its own.
 */
export function isConsentExpired(source: ConsentSource, consentedAt: Date, lastInteractionAt: Date | null, now: Date = new Date()): boolean {
  if (!IMPLIED_CONSENT_SOURCES.includes(source)) return false;
  const reference = lastInteractionAt ?? consentedAt;
  return now.getTime() - reference.getTime() > IMPLIED_CONSENT_EXPIRY_MS;
}

/** Lowercased/trimmed so suppression matches regardless of casing or a re-created customer record. */
export function normalizeContactValue(value: string): string {
  return value.trim().toLowerCase();
}
