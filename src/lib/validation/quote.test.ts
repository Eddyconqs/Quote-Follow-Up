import { describe, it, expect } from "vitest";
import { quoteSchema } from "./quote";

const validCuid = "cljk3x9y00000qzrmn831p7z1";

const base = {
  customerId: validCuid,
  title: "Remplacement de toiture",
  serviceType: "ROOFING" as const,
  amount: "4500",
  language: "FR" as const,
  quoteDate: "2024-06-01",
};

describe("quoteSchema", () => {
  it("accepts a minimal valid quote", () => {
    const result = quoteSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects a non-positive amount", () => {
    const result = quoteSchema.safeParse({ ...base, amount: "0" });
    expect(result.success).toBe(false);
  });

  it("rejects an expiration date before the quote date", () => {
    const result = quoteSchema.safeParse({ ...base, quoteDate: "2024-06-10", expirationDate: "2024-06-01" });
    expect(result.success).toBe(false);
  });

  it("accepts an expiration date after the quote date", () => {
    const result = quoteSchema.safeParse({ ...base, quoteDate: "2024-06-01", expirationDate: "2024-06-10" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid customer id", () => {
    const result = quoteSchema.safeParse({ ...base, customerId: "not-a-cuid" });
    expect(result.success).toBe(false);
  });
});
