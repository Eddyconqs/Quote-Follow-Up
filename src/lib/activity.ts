import "server-only";
import type { ActivityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logActivity(
  tx: Prisma.TransactionClient | typeof prisma,
  input: {
    companyId: string;
    quoteId?: string;
    userId?: string | null;
    type: ActivityType;
    description: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  return tx.activity.create({
    data: {
      companyId: input.companyId,
      quoteId: input.quoteId,
      userId: input.userId ?? undefined,
      type: input.type,
      description: input.description,
      metadata: input.metadata,
    },
  });
}
