import type { AiProvider, ReplyClassificationResult } from "@/lib/providers/types";
import { renderTemplate } from "@/lib/templates";

const FR_KEYWORDS = {
  PRICE_OBJECTION: ["prix", "cher", "dispendieux", "coûte", "coute", "budget"],
  WANTS_TO_SCHEDULE: ["quand", "disponib", "rendez-vous", "réserver", "reserver", "planifier", "date"],
  NOT_NOW: ["pas maintenant", "plus tard", "reporté", "reporte", "pas pour le moment"],
  DECLINED: ["non merci", "autre entreprise", "avons choisi", "avons choisis", "refus", "annulé", "annule"],
  INTERESTED: ["intéress", "interess", "ça me va", "ca me va", "parfait"],
} as const;

const EN_KEYWORDS = {
  PRICE_OBJECTION: ["price", "expensive", "cost", "budget", "cheaper"],
  WANTS_TO_SCHEDULE: ["when", "available", "schedule", "book", "appointment", "date"],
  NOT_NOW: ["not now", "later", "postpone", "not right now"],
  DECLINED: ["no thanks", "chose another", "went with", "decline", "cancelled", "canceled"],
  INTERESTED: ["interested", "sounds good", "works for me"],
} as const;

/** Pure keyword heuristic — exported separately so it's unit-testable without any provider wiring. */
export function classifyReplyHeuristic(body: string, language: "FR" | "EN"): ReplyClassificationResult {
  const text = body.toLowerCase();
  const keywordSets = language === "FR" ? FR_KEYWORDS : EN_KEYWORDS;

  const order: Array<keyof typeof keywordSets> = [
    "PRICE_OBJECTION",
    "WANTS_TO_SCHEDULE",
    "DECLINED",
    "NOT_NOW",
    "INTERESTED",
  ];

  for (const key of order) {
    const hit = keywordSets[key].some((kw) => text.includes(kw));
    if (hit) {
      return {
        classification: key,
        confidence: 0.75,
        requiresHumanAttention: key !== "NOT_NOW",
      };
    }
  }

  if (text.includes("?")) {
    return { classification: "QUESTION", confidence: 0.6, requiresHumanAttention: true };
  }

  return { classification: "UNCLEAR", confidence: 0.4, requiresHumanAttention: true };
}

/**
 * Mock AI provider. No real LLM is called. Drafts are always editable and never
 * auto-sent; classification only ever informs the dashboard/badges, it never
 * changes quote pricing, availability, warranties, or completion dates.
 */
class MockAiProvider implements AiProvider {
  async generateFollowUpDraft(input: {
    customerFirstName: string;
    quoteTitle: string;
    quoteAmount: string;
    language: "FR" | "EN";
    context?: string;
  }): Promise<{ draft: string }> {
    const template =
      input.language === "FR"
        ? "Bonjour {{firstName}}, je fais un suivi concernant votre soumission de {{quoteAmount}} pour {{quoteTitle}}. N'hésitez pas à nous écrire si vous avez des questions."
        : "Hi {{firstName}}, following up on your {{quoteAmount}} quote for {{quoteTitle}}. Feel free to reach out with any questions.";

    return {
      draft: renderTemplate(template, {
        firstName: input.customerFirstName,
        quoteTitle: input.quoteTitle,
        quoteAmount: input.quoteAmount,
      }),
    };
  }

  async classifyReply(body: string, language: "FR" | "EN"): Promise<ReplyClassificationResult> {
    return classifyReplyHeuristic(body, language);
  }

  async suggestLostReason(activitySummary: string): Promise<{ reason: string; rationale: string }> {
    const text = activitySummary.toLowerCase();
    if (text.includes("prix") || text.includes("price") || text.includes("cher") || text.includes("expensive")) {
      return { reason: "TOO_EXPENSIVE", rationale: "Price objection detected in recent activity." };
    }
    if (text.includes("no response") || text.includes("aucune réponse") || text.includes("aucune reponse")) {
      return { reason: "NO_RESPONSE", rationale: "No customer response across the follow-up sequence." };
    }
    return { reason: "OTHER", rationale: "Not enough signal to suggest a specific reason." };
  }

  async summarizeQuoteActivity(activityDescriptions: string[], language: "FR" | "EN"): Promise<{ summary: string }> {
    if (activityDescriptions.length === 0) {
      return { summary: language === "FR" ? "Aucune activité enregistrée." : "No activity recorded." };
    }
    const count = activityDescriptions.length;
    const last = activityDescriptions[activityDescriptions.length - 1];
    return {
      summary:
        language === "FR"
          ? `${count} événements enregistrés. Dernier: ${last}`
          : `${count} events recorded. Latest: ${last}`,
    };
  }
}

/**
 * Real provider slot: set AI_PROVIDER_API_KEY once a real LLM integration is
 * implemented. The MVP ships the mock provider only — AI is optional and never
 * required for the core follow-up workflow.
 */
export function getAiProvider(): AiProvider {
  return new MockAiProvider();
}
