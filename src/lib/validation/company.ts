import { z } from "zod";
import { optionalEmailSchema, optionalPhoneSchema, BUSINESS_TYPES, IANA_TIME_ZONES } from "@/lib/validation/shared";

export const businessHoursSchema = z.object({
  start: z.number().int().min(0).max(23),
  end: z.number().int().min(1).max(24),
  days: z.array(z.number().int().min(0).max(6)).min(0).max(7),
});

export const onboardingSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    businessType: z.enum(BUSINESS_TYPES),
    defaultLanguage: z.enum(["FR", "EN"]),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    timeZone: z.enum(IANA_TIME_ZONES),
    defaultCurrency: z.enum(["CAD", "USD"]),
  })
  .strict();

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const companyProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(160),
    businessType: z.enum(BUSINESS_TYPES),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    address: z.string().trim().max(300).optional().transform((v) => (v ? v : undefined)),
    defaultLanguage: z.enum(["FR", "EN"]),
    defaultCurrency: z.enum(["CAD", "USD"]),
    timeZone: z.enum(IANA_TIME_ZONES),
    businessHours: businessHoursSchema,
    approvalMode: z.boolean(),
  })
  .strict();

export type CompanyProfileInput = z.infer<typeof companyProfileSchema>;
