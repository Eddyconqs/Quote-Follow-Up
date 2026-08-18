import { z } from "zod";

export const SERVICE_TYPES = [
  "HVAC",
  "PLUMBING",
  "ELECTRICAL",
  "ROOFING",
  "RENOVATION",
  "LANDSCAPING",
  "COMMERCIAL_MAINTENANCE",
  "OTHER",
] as const;

export const quoteSchema = z
  .object({
    customerId: z.string().cuid("Veuillez sélectionner un client."),
    title: z.string().trim().min(2, "Le titre est requis.").max(200),
    description: z.string().trim().max(4000).optional().transform((v) => (v ? v : undefined)),
    serviceType: z.enum(SERVICE_TYPES),
    amount: z.coerce.number().positive("Le montant doit être supérieur à 0.").max(10_000_000),
    currency: z.enum(["CAD", "USD"]).default("CAD"),
    language: z.enum(["FR", "EN"]),
    quoteDate: z.coerce.date(),
    expirationDate: z.coerce.date().optional(),
    notes: z.string().trim().max(4000).optional().transform((v) => (v ? v : undefined)),
    source: z
      .enum(["MANUAL", "IMPORTED", "CRM_INTEGRATION", "WEBSITE_FORM", "PHONE_CALL", "EMAIL", "OTHER"])
      .default("MANUAL"),
    assignedUserId: z.string().cuid().optional(),
  })
  .strict()
  .refine((data) => !data.expirationDate || data.expirationDate >= data.quoteDate, {
    message: "La date d'expiration doit être après la date de la soumission.",
    path: ["expirationDate"],
  });

export type QuoteInput = z.infer<typeof quoteSchema>;

export const LOST_REASONS = [
  "TOO_EXPENSIVE",
  "CHOSE_ANOTHER_COMPANY",
  "NO_RESPONSE",
  "PROJECT_POSTPONED",
  "PROJECT_CANCELLED",
  "COULD_NOT_REACH_CUSTOMER",
  "OTHER",
] as const;

export const markLostSchema = z.object({
  quoteId: z.string().cuid(),
  lostReason: z.enum(LOST_REASONS),
  notes: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
});

export const manualMessageSchema = z.object({
  quoteId: z.string().cuid(),
  channel: z.enum(["EMAIL", "SMS", "MANUAL_TASK"]),
  subject: z.string().trim().max(200).optional().transform((v) => (v ? v : undefined)),
  body: z.string().trim().min(1, "Le message ne peut pas être vide.").max(4000),
});

export const simulateReplySchema = z.object({
  quoteId: z.string().cuid(),
  messageId: z.string().cuid().optional(),
  body: z.string().trim().min(1, "La réponse ne peut pas être vide.").max(4000),
});

export const jobHandoffSchema = z.object({
  quoteId: z.string().cuid(),
  serviceType: z.enum(SERVICE_TYPES).optional(),
  notes: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
  scheduledDate: z.coerce.date().optional(),
  assignedUserId: z.string().cuid().optional(),
});
