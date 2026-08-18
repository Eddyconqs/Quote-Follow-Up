import { describe, it, expect } from "vitest";
import { renderTemplate } from "./templates";

describe("renderTemplate", () => {
  it("substitutes known variables", () => {
    const result = renderTemplate("Bonjour {{firstName}}, votre soumission {{quoteTitle}} est prête.", {
      firstName: "Marie",
      quoteTitle: "Toiture",
    });
    expect(result).toBe("Bonjour Marie, votre soumission Toiture est prête.");
  });

  it("leaves unknown placeholders untouched instead of throwing", () => {
    const result = renderTemplate("Bonjour {{firstName}}, {{unknownVar}}.", { firstName: "Marie" });
    expect(result).toBe("Bonjour Marie, {{unknownVar}}.");
  });

  it("tolerates extra whitespace inside the braces", () => {
    const result = renderTemplate("Bonjour {{ firstName }}.", { firstName: "Marie" });
    expect(result).toBe("Bonjour Marie.");
  });

  it("never evaluates the substituted value as another template", () => {
    const result = renderTemplate("{{firstName}}", { firstName: "{{quoteTitle}}" });
    expect(result).toBe("{{quoteTitle}}");
  });

  it("does not render HTML-unsafe input any differently — output is always plain text", () => {
    const result = renderTemplate("Bonjour {{firstName}}", { firstName: "<script>alert(1)</script>" });
    expect(result).toBe("Bonjour <script>alert(1)</script>");
  });
});
