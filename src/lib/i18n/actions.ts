"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Sets the interface language cookie, and syncs the user's stored preference when signed in. */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax",
  });

  const user = await getCurrentUser();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { preferredLanguage: (locale as Locale).toUpperCase() as "FR" | "EN" },
    });
  }

  revalidatePath("/", "layout");
}
