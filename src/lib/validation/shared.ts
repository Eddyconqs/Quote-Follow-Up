import { z } from "zod";

/** Loose North American phone validation: digits, spaces, parens, dashes, optional leading +. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9()\-.\s]{7,20}$/, "Numéro de téléphone invalide.");

export const optionalPhoneSchema = z
  .union([phoneSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const emailSchema = z.string().trim().toLowerCase().email("Courriel invalide.");

export const optionalEmailSchema = z
  .union([emailSchema, z.literal("")])
  .optional()
  .transform((v) => (v ? v : undefined));

export const BUSINESS_TYPES = [
  "HVAC",
  "PLUMBING",
  "ELECTRICAL",
  "ROOFING",
  "RENOVATION",
  "LANDSCAPING",
  "COMMERCIAL_MAINTENANCE",
  "OTHER",
] as const;

export const IANA_TIME_ZONES = [
  "America/Toronto",
  "America/Vancouver",
  "America/Edmonton",
  "America/Winnipeg",
  "America/Halifax",
  "America/St_Johns",
] as const;
