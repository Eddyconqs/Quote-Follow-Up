import { describe, it, expect } from "vitest";
import { customerSchema } from "./customer";

const base = {
  firstName: "Marie",
  lastName: "Tremblay",
  preferredLanguage: "FR" as const,
  emailConsent: false,
  smsConsent: false,
};

describe("customerSchema", () => {
  it("accepts a minimal valid customer", () => {
    const result = customerSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects email consent without an email address", () => {
    const result = customerSchema.safeParse({ ...base, emailConsent: true });
    expect(result.success).toBe(false);
  });

  it("rejects SMS consent without a phone number", () => {
    const result = customerSchema.safeParse({ ...base, smsConsent: true });
    expect(result.success).toBe(false);
  });

  it("accepts email consent when an email is provided", () => {
    const result = customerSchema.safeParse({ ...base, email: "marie@example.com", emailConsent: true });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = customerSchema.safeParse({ ...base, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});
