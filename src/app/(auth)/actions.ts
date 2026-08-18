"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSessionCookie, destroySessionCookie } from "@/lib/auth";
import { signupSchema, loginSchema } from "@/lib/validation/auth";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { ensureDefaultSequences } from "@/lib/follow-up/default-sequences";
import { getDictionaryFor } from "@/lib/i18n";

export type AuthFormState = { error?: string };

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    companyName: formData.get("companyName"),
    preferredLanguage: formData.get("preferredLanguage") ?? "FR",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { name, email, password, companyName, preferredLanguage } = parsed.data;
  const dict = getDictionaryFor(preferredLanguage === "FR" ? "fr" : "en");

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: dict.auth.emailInUse };
  }

  const passwordHash = await hashPassword(password);

  const { user, companyId } = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        defaultLanguage: preferredLanguage,
        defaultCurrency: "CAD",
        timeZone: "America/Toronto",
      },
    });
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "OWNER",
        companyId: company.id,
        preferredLanguage,
      },
    });
    return { user: createdUser, companyId: company.id };
  });

  await ensureDefaultSequences(companyId);

  await createSessionCookie({ userId: user.id, companyId, role: user.role, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, preferredLanguage === "FR" ? "fr" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365 });

  redirect("/onboarding");
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  const dict = getDictionaryFor("fr");
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: dict.auth.invalidCredentials };
  }

  await createSessionCookie({ userId: user.id, companyId: user.companyId, role: user.role, email: user.email });

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, user.preferredLanguage === "FR" ? "fr" : "en", { path: "/", maxAge: 60 * 60 * 24 * 365 });

  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/login");
}
