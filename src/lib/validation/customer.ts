import { z } from "zod";
import { optionalEmailSchema, optionalPhoneSchema } from "@/lib/validation/shared";

export const customerSchema = z
  .object({
    firstName: z.string().trim().min(1, "Le prénom est requis.").max(100),
    lastName: z.string().trim().min(1, "Le nom est requis.").max(100),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    preferredLanguage: z.enum(["FR", "EN"]).default("FR"),
    address: z.string().trim().max(300).optional().transform((v) => (v ? v : undefined)),
    notes: z.string().trim().max(2000).optional().transform((v) => (v ? v : undefined)),
    emailConsent: z.boolean().default(false),
    smsConsent: z.boolean().default(false),
  })
  .strict()
  .refine((data) => !data.emailConsent || !!data.email, {
    message: "Une adresse courriel est requise pour activer le consentement courriel.",
    path: ["emailConsent"],
  })
  .refine((data) => !data.smsConsent || !!data.phone, {
    message: "Un numéro de téléphone est requis pour activer le consentement SMS.",
    path: ["smsConsent"],
  });

export type CustomerInput = z.infer<typeof customerSchema>;
