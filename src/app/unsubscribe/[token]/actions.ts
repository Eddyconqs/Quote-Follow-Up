"use server";

import { revalidatePath } from "next/cache";
import type { Channel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { recordUnsubscribe } from "@/lib/compliance/consent";

/**
 * Public, unauthenticated action behind the unsubscribe link in every outbound email.
 * Looks the customer up by their unsubscribe token only — no session, no companyId in
 * the URL, so the link works standalone the way CASL requires.
 */
export async function unsubscribeAction(token: string, channel: Channel) {
  const customer = await prisma.customer.findUnique({ where: { unsubscribeToken: token } });
  if (!customer) return;

  await prisma.$transaction((tx) => recordUnsubscribe(tx, { companyId: customer.companyId, customer, channel, source: "LINK_CLICK" }));

  revalidatePath(`/unsubscribe/${token}`);
}
