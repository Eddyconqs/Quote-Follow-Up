import "server-only";
import type { SmsProvider, SendResult } from "@/lib/providers/types";

/** Mock delivery provider. Never contacts a real SMS gateway. */
class MockSmsProvider implements SmsProvider {
  async send(input: { to: string; body: string; language: "FR" | "EN" }): Promise<SendResult> {
    const failed = Math.random() < 0.05;
    // eslint-disable-next-line no-console
    console.log(`[mock-sms] to=${input.to} ${failed ? "FAILED" : "sent"}`);

    if (failed) {
      return { status: "failed", failureReason: "Mock provider simulated delivery failure." };
    }

    return { status: "sent", providerMessageId: `mock-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  }
}

/**
 * Real provider slot: set SMS_PROVIDER_API_KEY once a Canadian-compatible SMS
 * provider (e.g. Twilio) is wired in. The MVP ships the mock provider only.
 */
export function getSmsProvider(): SmsProvider {
  return new MockSmsProvider();
}
