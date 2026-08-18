import "server-only";
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
 * Real provider slot: set EMAIL_PROVIDER_API_KEY to opt in once a real integration
 * (e.g. Gmail/Outlook API) is implemented. The MVP ships the mock provider only —
 * no real messages are ever sent by default.
 */
export function getEmailProvider(): EmailProvider {
  return new MockEmailProvider();
}
