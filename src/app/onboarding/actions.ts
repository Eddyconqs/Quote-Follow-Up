"use server";

import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validation/company";
import { DEFAULT_BUSINESS_HOURS } from "@/lib/follow-up/business-hours";

export type OnboardingFormState = { error?: string };

export async function completeOnboardingAction(_prev: OnboardingFormState, formData: FormData): Promise<OnboardingFormState> {
  const user = await requireCurrentUser();

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    defaultLanguage: formData.get("defaultLanguage"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    timeZone: formData.get("timeZone"),
    defaultCurrency: formData.get("defaultCurrency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.company.update({
    where: { id: user.companyId },
    data: { ...parsed.data, businessHours: DEFAULT_BUSINESS_HOURS as unknown as Prisma.InputJsonValue },
  });

  redirect("/dashboard");
}
