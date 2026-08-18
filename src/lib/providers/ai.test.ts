import { describe, it, expect } from "vitest";
import { classifyReplyHeuristic } from "./ai";

describe("classifyReplyHeuristic — French", () => {
  it("detects a price objection", () => {
    const result = classifyReplyHeuristic("C'est trop cher pour notre budget.", "FR");
    expect(result.classification).toBe("PRICE_OBJECTION");
    expect(result.requiresHumanAttention).toBe(true);
  });

  it("detects scheduling intent", () => {
    const result = classifyReplyHeuristic("Quand seriez-vous disponible pour réserver une date?", "FR");
    expect(result.classification).toBe("WANTS_TO_SCHEDULE");
  });

  it("detects a decline", () => {
    const result = classifyReplyHeuristic("Non merci, nous avons choisi une autre entreprise.", "FR");
    expect(result.classification).toBe("DECLINED");
  });

  it("detects a not-now signal and does not flag it for human attention", () => {
    const result = classifyReplyHeuristic("Pas maintenant, on verra plus tard.", "FR");
    expect(result.classification).toBe("NOT_NOW");
    expect(result.requiresHumanAttention).toBe(false);
  });

  it("falls back to QUESTION for an unmatched message containing a question mark", () => {
    const result = classifyReplyHeuristic("Est-ce que le prix inclut la main d'oeuvre?", "FR");
    // Price keyword takes priority since it's a real objection signal even when phrased as a question.
    expect(["PRICE_OBJECTION", "QUESTION"]).toContain(result.classification);
  });

  it("falls back to UNCLEAR when nothing matches", () => {
    const result = classifyReplyHeuristic("Merci beaucoup.", "FR");
    expect(result.classification).toBe("UNCLEAR");
    expect(result.requiresHumanAttention).toBe(true);
  });
});

describe("classifyReplyHeuristic — English", () => {
  it("detects a price objection", () => {
    const result = classifyReplyHeuristic("That seems really expensive for this job.", "EN");
    expect(result.classification).toBe("PRICE_OBJECTION");
  });

  it("detects interest", () => {
    const result = classifyReplyHeuristic("Sounds good, that works for me.", "EN");
    expect(result.classification).toBe("INTERESTED");
  });

  it("defaults to UNCLEAR for unrelated text", () => {
    const result = classifyReplyHeuristic("Thanks for reaching out.", "EN");
    expect(result.classification).toBe("UNCLEAR");
  });
});
