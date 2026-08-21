import type { Company } from "@prisma/client";

/** CASL requires a valid sender identity (business name + contact address) on every commercial email. */
export function hasSenderIdentity(company: Pick<Company, "name" | "email">): boolean {
  return !!company.name?.trim() && !!company.email?.trim();
}
