import "server-only";
import type { SendResult } from "@/lib/providers/types";
import { getEmailProvider } from "@/lib/providers/email";
import { getSmsProvider } from "@/lib/providers/sms";

/** Dispatches a message through the right mock provider for its channel (EMAIL or SMS only — MANUAL_TASK never calls a provider). */
export async function sendViaChannel(
  channel: "EMAIL" | "SMS",
  input: { to: string; subject: string; body: string; language: "FR" | "EN" }
): Promise<SendResult> {
  if (channel === "EMAIL") {
    return getEmailProvider().send({ to: input.to, subject: input.subject, body: input.body, language: input.language });
  }
  return getSmsProvider().send({ to: input.to, body: input.body, language: input.language });
}
