import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency: "CAD" | "USD" = "CAD", locale: "fr" | "en" = "fr") {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat(locale === "fr" ? "fr-CA" : "en-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date | string, locale: "fr" | "en" = "fr", opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CA" : "en-CA", opts ?? { dateStyle: "medium" }).format(d);
}

export function formatDateTime(date: Date | string, locale: "fr" | "en" = "fr") {
  return formatDate(date, locale, { dateStyle: "medium", timeStyle: "short" });
}

export function daysSince(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
