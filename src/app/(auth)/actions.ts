"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSessionCookie,
  destroySessionCookie,
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth";
import { signupSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validation/auth";
import { LOCALE_COOKIE } from "@/lib/i18n";
import { ensureDefaultSequences } from "@/lib/follow-up/default-sequences";
import { getDictionaryFor } from "@/lib/i18n";
import { getEmailProvider } from "@/lib/providers/email";
import { renderTemplate } from "@/lib/templates";


export type AuthFormState = { error?: string; success?: boolean };

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

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

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

  if (user?.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    return { error: renderTemplate(dict.auth.accountLocked, { minutes: String(minutes) }) };
  }

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    if (user) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_LOGIN_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000) : null,
        },
      });
    }
    return { error: dict.auth.invalidCredentials };
  }

  if (user.failedLoginAttempts > 0 || user.lockedUntil) {
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
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

async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Always returns success (no error) regardless of whether the email exists, to avoid leaking which emails have accounts. */
export async function forgotPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  if (user) {
    const token = await createPasswordResetToken(user.id, user.passwordHash);
    const baseUrl = await getBaseUrl();
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    const dict = getDictionaryFor(user.preferredLanguage === "FR" ? "fr" : "en");

    await getEmailProvider()
      .send({
        to: user.email,
        subject: dict.auth.resetEmailSubject,
        body: renderTemplate(dict.auth.resetEmailBody, { name: user.name, resetUrl }),
        language: user.preferredLanguage,
      })
      .catch(() => undefined); // Never let a delivery failure change the response the client sees.
  }

  return { success: true };
}

export async function resetPasswordAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const result = await verifyPasswordResetToken(parsed.data.token);
  const dict = getDictionaryFor("fr");
  if (!result) {
    return { error: dict.auth.resetInvalidToken };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: result.userId }, data: { passwordHash } });

  redirect("/login?reset=success");
}
