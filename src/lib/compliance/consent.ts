import "server-only";
import type { Prisma, Channel, Customer, ConsentSource, UnsubscribeSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { isConsentExpired, normalizeContactValue } from "@/lib/compliance/consent-rules";

type TxClient = Prisma.TransactionClient | typeof prisma;

/** Appends one immutable consent-origin record. Never call `update`/`delete` against this model. */
export async function recordConsent(
  tx: TxClient,
  input: {
    companyId: string;
    customerId: string;
    channel: Channel;
    source: ConsentSource;
    consentedAt: Date;
    recordedByUserId?: string | null;
  }
) {
  return tx.consentRecord.create({
    data: {
      companyId: input.companyId,
      customerId: input.customerId,
      channel: input.channel,
      source: input.source,
      consentedAt: input.consentedAt,
      recordedByUserId: input.recordedByUserId ?? undefined,
    },
  });
}

/** Checks the append-only unsubscribe log — the only source of truth for suppression, independent of any mutable boolean. */
export async function isUnsubscribed(tx: TxClient, companyId: string, channel: Channel, contactValue: string): Promise<boolean> {
  const existing = await tx.unsubscribeEvent.findFirst({
    where: { companyId, channel, contactValue: normalizeContactValue(contactValue) },
    select: { id: true },
  });
  return !!existing;
}

/**
 * Appends an unsubscribe event (idempotent — a repeat click is a no-op) and flips the
 * customer's display boolean to false. This is the ONLY code path allowed to write
 * emailConsent/smsConsent to false-after-unsubscribe, and no code path may ever set it
 * back to true for a customer that has an UnsubscribeEvent on record.
 */
export async function recordUnsubscribe(
  tx: TxClient,
  input: { companyId: string; customer: Customer; channel: Channel; source: UnsubscribeSource }
) {
  const contactValue = normalizeContactValue(input.channel === "EMAIL" ? input.customer.email ?? "" : input.customer.phone ?? "");
  if (!contactValue) return null;

  const alreadyUnsubscribed = await isUnsubscribed(tx, input.companyId, input.channel, contactValue);
  if (alreadyUnsubscribed) return null;

  const event = await tx.unsubscribeEvent.create({
    data: {
      companyId: input.companyId,
      customerId: input.customer.id,
      channel: input.channel,
      contactValue,
      source: input.source,
    },
  });

  await tx.customer.update({
    where: { id: input.customer.id },
    data: input.channel === "EMAIL" ? { emailConsent: false } : { smsConsent: false },
  });

  await logActivity(tx, {
    companyId: input.companyId,
    userId: undefined,
    type: "CUSTOMER_UNSUBSCRIBED",
    description: `Customer unsubscribed from ${input.channel.toLowerCase()} (${input.source}).`,
    metadata: { customerId: input.customer.id, channel: input.channel },
  });

  return event;
}

export type ConsentStatus = {
  hasRecord: boolean;
  isExpired: boolean;
  isUnsubscribed: boolean;
};

/** Reads the latest ConsentRecord for this channel plus the unsubscribe log and computes live expiry. No stored expiry field — it is always derived. */
export async function getConsentStatus(
  tx: TxClient,
  customer: Pick<Customer, "id" | "email" | "phone" | "lastInteractionAt" | "createdAt">,
  companyId: string,
  channel: Channel
): Promise<ConsentStatus> {
  const contactValue = channel === "EMAIL" ? customer.email : customer.phone;

  const unsubscribed = contactValue ? await isUnsubscribed(tx, companyId, channel, contactValue) : false;
  if (unsubscribed) {
    return { hasRecord: true, isExpired: false, isUnsubscribed: true };
  }

  const latest = await tx.consentRecord.findFirst({
    where: { companyId, customerId: customer.id, channel },
    orderBy: { consentedAt: "desc" },
  });

  if (!latest) {
    return { hasRecord: false, isExpired: false, isUnsubscribed: false };
  }

  const expired = isConsentExpired(latest.source, latest.consentedAt, customer.lastInteractionAt);
  return { hasRecord: true, isExpired: expired, isUnsubscribed: false };
}
