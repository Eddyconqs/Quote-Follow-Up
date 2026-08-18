import "server-only";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function createJobHandoff(
  input: { quoteId: string; serviceType?: string; notes?: string; scheduledDate?: Date; assignedUserId?: string },
  companyId: string,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findFirstOrThrow({ where: { id: input.quoteId, companyId } });

    const existing = await tx.jobHandoff.findFirst({ where: { quoteId: quote.id, companyId } });
    if (existing) throw new Error("HANDOFF_ALREADY_EXISTS");

    const handoff = await tx.jobHandoff.create({
      data: {
        companyId,
        quoteId: quote.id,
        customerId: quote.customerId,
        status: input.scheduledDate ? "SCHEDULED" : "READY_FOR_SCHEDULING",
        serviceType: input.serviceType ?? quote.serviceType,
        notes: input.notes,
        scheduledDate: input.scheduledDate,
        assignedUserId: input.assignedUserId,
      },
    });

    await logActivity(tx, {
      companyId,
      quoteId: quote.id,
      userId,
      type: "JOB_HANDOFF_CREATED",
      description: "Job handoff created for won quote.",
      metadata: { handoffId: handoff.id },
    });

    return handoff;
  });
}

export async function updateJobHandoffStatus(
  handoffId: string,
  companyId: string,
  userId: string,
  status: "NOT_STARTED" | "READY_FOR_SCHEDULING" | "SCHEDULED" | "COMPLETED" | "CANCELLED"
) {
  return prisma.$transaction(async (tx) => {
    const handoff = await tx.jobHandoff.findFirstOrThrow({ where: { id: handoffId, companyId } });
    await tx.jobHandoff.update({ where: { id: handoff.id }, data: { status } });
    await logActivity(tx, {
      companyId,
      quoteId: handoff.quoteId,
      userId,
      type: "JOB_HANDOFF_UPDATED",
      description: `Job handoff status changed to ${status}.`,
      metadata: { handoffId: handoff.id, status },
    });
  });
}
