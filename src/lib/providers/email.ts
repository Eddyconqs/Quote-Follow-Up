import "server-only";
import { Resend } from "resend";
import type { EmailProvider, SendResult } from "@/lib/providers/types";

/**
 * Mock delivery provider. Never contacts a real email service. Simulates an
 * occasional delivery failure so the retry path in the follow-up engine is exercised.
 */
class MockEmailProvider implements EmailProvider {
  async send(input: { to: string; subject: string; body: string; language: "FR" | "EN" }): Promise<SendResult> {
    const failed = Math.random() < 0.05;
    // eslint-disable-next-line no-console
    console.log(`[mock-email] to=${input.to} subject="${input.subject}" ${failed ? "FAILED" : "sent"}`);

    if (failed) {
      return { status: "failed", failureReason: "Mock provider simulated delivery failure." };
    }

    return { status: "sent", providerMessageId: `mock-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  }
}

/**
 * Real provider, used when EMAIL_PROVIDER_API_KEY is set. Until a sending domain is
 * verified in Resend, EMAIL_FROM_ADDRESS must stay on Resend's shared test domain
 * (onboarding@resend.dev), and Resend will only actually deliver to the email address
 * that owns the Resend account — everything else is silently accepted but not sent.
 */
class ResendEmailProvider implements EmailProvider {
  private client: Resend;
  private from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(input: { to: string; subject: string; body: string; language: "FR" | "EN" }): Promise<SendResult> {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: input.to,
      subject: input.subject,
      text: input.body,
    });

    if (error) {
      return { status: "failed", failureReason: error.message };
    }

    return { status: "sent", providerMessageId: data?.id };
  }
}

export function getEmailProvider(): EmailProvider {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  if (apiKey) {
    const from = process.env.EMAIL_FROM_ADDRESS || "onboarding@resend.dev";
    return new ResendEmailProvider(apiKey, from);
  }
  return new MockEmailProvider();
}
