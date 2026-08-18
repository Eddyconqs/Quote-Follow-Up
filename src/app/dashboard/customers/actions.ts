"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth";
import { customerSchema } from "@/lib/validation/customer";
import type { Customer } from "@prisma/client";

export type CustomerFormState = { error?: string; customer?: Customer };

function parseCustomerFormData(formData: FormData) {
  return customerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    preferredLanguage: formData.get("preferredLanguage") ?? "FR",
    address: formData.get("address") ?? "",
    notes: formData.get("notes") ?? "",
    emailConsent: formData.get("emailConsent") === "on",
    smsConsent: formData.get("smsConsent") === "on",
  });
}

/** Used directly by the standalone "new customer" page (redirects on success). */
export async function createCustomerAction(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const user = await requireCurrentUser();
  const parsed = parseCustomerFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  await prisma.customer.create({ data: { ...parsed.data, companyId: user.companyId } });

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

/** Used by the inline "create customer" dialog on the quote form (returns the created customer instead of redirecting). */
export async function createCustomerInlineAction(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const user = await requireCurrentUser();
  const parsed = parseCustomerFormData(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }

  const customer = await prisma.customer.create({ data: { ...parsed.data, companyId: user.companyId } });
  revalidatePath("/dashboard/customers");
  return { customer };
}

export async function softDeleteCustomerAction(customerId: string) {
  const user = await requireCurrentUser();
  await prisma.customer.updateMany({
    where: { id: customerId, companyId: user.companyId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/dashboard/customers");
}
