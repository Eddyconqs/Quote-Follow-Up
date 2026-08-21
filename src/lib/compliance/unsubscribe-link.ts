import type { Channel, Customer, Language } from "@prisma/client";

/** Builds the public, no-auth unsubscribe URL for a customer/channel pair. */
export function buildUnsubscribeUrl(customer: Pick<Customer, "unsubscribeToken">, channel: Channel): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/unsubscribe/${customer.unsubscribeToken}?c=${channel}`;
}

const FOOTER = {
  FR: (url: string) => `\n\n---\nPour ne plus recevoir de courriels de notre part, cliquez ici : ${url}`,
  EN: (url: string) => `\n\n---\nTo stop receiving emails from us, click here: ${url}`,
} satisfies Record<Language, (url: string) => string>;

/**
 * Appends a functional unsubscribe footer to an outbound email body. Called exactly
 * once, at compose time, on the rendered body — never exposed as an editable
 * template token, so a tenant cannot author a step message that omits it.
 */
export function appendUnsubscribeFooter(body: string, url: string, language: Language): string {
  return `${body}${FOOTER[language](url)}`;
}
