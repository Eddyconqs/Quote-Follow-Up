"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, destroySessionCookie } from "@/lib/auth";
import { companyProfileSchema } from "@/lib/validation/company";
import { followUpSequenceSchema } from "@/lib/validation/follow-up";
import { LOCALE_COOKIE } from "@/lib/i18n";

export type SettingsActionState = { error?: string; success?: boolean };
const OK: SettingsActionState = { success: true };

export async function updateCompanyProfileAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const user = await requireCurrentUser();

  const parsed = companyProfileSchema.safeParse({
    name: formData.get("name"),
    businessType: formData.get("businessType"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    defaultLanguage: formData.get("defaultLanguage"),
    defaultCurrency: formData.get("defaultCurrency"),
    timeZone: formData.get("timeZone"),
    businessHours: {
      start: Number(formData.get("businessHoursStart")),
      end: Number(formData.get("businessHoursEnd")),
      days: formData.getAll("businessHoursDays").map(Number),
    },
    approvalMode: formData.get("approvalMode") === "on",
    privacyOfficerName: formData.get("privacyOfficerName") ?? "",
    privacyOfficerEmail: formData.get("privacyOfficerEmail") ?? "",
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  await prisma.company.update({
    where: { id: user.companyId },
    data: { ...parsed.data, businessHours: parsed.data.businessHours as unknown as Prisma.InputJsonValue },
  });

  revalidatePath("/dashboard/settings");
  return OK;
}

export async function updateSequenceAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const user = await requireCurrentUser();

  const raw = formData.get("payload");
  if (typeof raw !== "string") return { error: "Invalid payload." };

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { error: "Invalid payload." };
  }

  const parsed = followUpSequenceSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  if (!parsed.data.id) return { error: "Missing sequence id." };

  await prisma.$transaction(async (tx) => {
    await tx.followUpSequence.findFirstOrThrow({ where: { id: parsed.data.id, companyId: user.companyId } });
    await tx.followUpStep.deleteMany({ where: { sequenceId: parsed.data.id } });
    await tx.followUpSequence.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        active: parsed.data.active,
        steps: { create: parsed.data.steps },
      },
    });
  });

  revalidatePath("/dashboard/settings");
  return OK;
}

const userProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
  preferredLanguage: z.enum(["FR", "EN"]),
});

export async function updateUserProfileAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const user = await requireCurrentUser();
  const parsed = userProfileSchema.safeParse({
    name: formData.get("name"),
    preferredLanguage: formData.get("preferredLanguage"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };

  await prisma.user.update({ where: { id: user.id }, data: parsed.data });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, parsed.data.preferredLanguage === "FR" ? "fr" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365 });

  revalidatePath("/dashboard/settings");
  return OK;
}

export async function deleteAccountAction(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const user = await requireCurrentUser();
  const confirmName = formData.get("confirmName");

  if (confirmName !== user.company.name) {
    return { error: "Le nom de l'entreprise ne correspond pas." };
  }

  await prisma.company.delete({ where: { id: user.companyId } });
  await destroySessionCookie();
  redirect("/");
}
