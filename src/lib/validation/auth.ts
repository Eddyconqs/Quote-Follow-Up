import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
  .max(128)
  .regex(/[a-z]/, "Le mot de passe doit contenir une lettre minuscule.")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une lettre majuscule.")
  .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre.");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(120),
  email: z.string().trim().toLowerCase().email("Courriel invalide."),
  password: passwordSchema,
  companyName: z.string().trim().min(2, "Le nom de l'entreprise est requis.").max(160),
  preferredLanguage: z.enum(["FR", "EN"]).default("FR"),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Courriel invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Courriel invalide."),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
