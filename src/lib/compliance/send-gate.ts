import "server-only";
import type { Prisma, Channel, Company, Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getConsentStatus } from "@/lib/compliance/consent";
import { hasSenderIdentity } from "@/lib/compliance/sender-identity";
import { decideSendGate, type SendGateResult, type SendBlockReason } from "@/lib/compliance/send-gate-rules";

export type { SendGateResult, SendBlockReason };

type TxClient = Prisma.TransactionClient | typeof prisma;

/**
 * The single choke point every outbound send (scheduler, manual, approval, retry) must
 * pass through. Never throws — callers decide whether a rejection means "skip silently
 * and log" (the scheduler) or "surface an error" (an interactive send).
 */
export async function assertSendAllowed(
  tx: TxClient,
  input: {
    company: Pick<Company, "name" | "email">;
    customer: Pick<Customer, "id" | "email" | "phone" | "lastInteractionAt" | "createdAt">;
    companyId: string;
    channel: Channel;
  }
): Promise<SendGateResult> {
  const contactValue = input.channel === "EMAIL" ? input.customer.email : input.customer.phone;
  const status = await getConsentStatus(tx, input.customer, input.companyId, input.channel);

  return decideSendGate({
    channel: input.channel,
    hasSenderIdentity: hasSenderIdentity(input.company),
    hasContact: !!contactValue,
    isUnsubscribed: status.isUnsubscribed,
    hasConsentRecord: status.hasRecord,
    isConsentExpired: status.isExpired,
  });
}
