import { z } from "zod";

export const followUpStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  delayInDays: z.number().int().min(0).max(365),
  channel: z.enum(["EMAIL", "SMS", "MANUAL_TASK"]),
  subject: z.string().trim().max(200).optional().transform((v) => (v ? v : undefined)),
  message: z.string().trim().min(1, "Le message ne peut pas être vide.").max(4000),
  requiresApproval: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const followUpSequenceSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(160),
  language: z.enum(["FR", "EN"]),
  active: z.boolean().default(true),
  steps: z.array(followUpStepSchema).min(1, "La séquence doit contenir au moins une étape."),
});

export type FollowUpSequenceInput = z.infer<typeof followUpSequenceSchema>;
