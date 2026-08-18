import "server-only";
import { cookies } from "next/headers";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { en } from "@/lib/i18n/dictionaries/en";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

export type Dictionary = typeof fr;

const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Reads the interface locale from the NEXT_LOCALE cookie. Defaults to French. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function getDictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Reads the current locale and returns its dictionary in one call for server components. */
export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: getDictionaryFor(locale) };
}
