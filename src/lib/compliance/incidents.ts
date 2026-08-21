import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Prisma.TransactionClient | typeof prisma;

/**
 * Loi 25 requires an incident log for personal-data access/leak/incident events.
 * Append-only: no update/delete function exists for this model. No admin UI yet —
 * rows are written directly by the code paths that detect an incident, and read via
 * direct DB/Prisma Studio access until an admin UI is built.
 */
export async function logPrivacyIncident(
  tx: TxClient,
  input: {
    companyId: string;
    category: "unauthorized_access" | "data_leak" | "vendor_incident" | "other";
    description: string;
    affectedCustomerId?: string;
    metadata?: Prisma.InputJsonValue;
  }
) {
  return tx.privacyIncident.create({
    data: {
      companyId: input.companyId,
      category: input.category,
      description: input.description,
      affectedCustomerId: input.affectedCustomerId,
      metadata: input.metadata,
    },
  });
}
