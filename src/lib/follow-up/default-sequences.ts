import "server-only";
import { prisma } from "@/lib/prisma";

interface DefaultStep {
  stepNumber: number;
  delayInDays: number;
  message: string;
}

const FR_STEPS: DefaultStep[] = [
  {
    stepNumber: 1,
    delayInDays: 0,
    message:
      "Bonjour {{firstName}}, nous vous avons envoyé une soumission pour {{quoteTitle}}. Avez-vous eu la chance de la consulter? Nous sommes disponibles si vous avez des questions.",
  },
  {
    stepNumber: 2,
    delayInDays: 3,
    message:
      "Bonjour {{firstName}}, je fais un suivi concernant votre soumission de {{quoteAmount}} pour {{quoteTitle}}. Souhaitez-vous que nous répondions à vos questions ou que nous réservions une date?",
  },
  {
    stepNumber: 3,
    delayInDays: 7,
    message:
      "Bonjour {{firstName}}, notre soumission est toujours disponible. Si votre projet est reporté ou si vous avez choisi une autre option, vous pouvez simplement nous le dire. Merci!",
  },
];

const EN_STEPS: DefaultStep[] = [
  {
    stepNumber: 1,
    delayInDays: 0,
    message: "Hi {{firstName}}, we sent you a quote for {{quoteTitle}}. Did you have a chance to review it? We're happy to answer any questions.",
  },
  {
    stepNumber: 2,
    delayInDays: 3,
    message:
      "Hi {{firstName}}, I'm following up about your {{quoteAmount}} quote for {{quoteTitle}}. Would you like us to answer any questions or reserve a date?",
  },
  {
    stepNumber: 3,
    delayInDays: 7,
    message: "Hi {{firstName}}, our quote is still available. If your project has been postponed or you chose another option, just let us know. Thank you!",
  },
];

/**
 * Creates the two default FR/EN follow-up sequences for a company if they don't
 * already exist. Idempotent — safe to call from onboarding completion and seeding.
 */
export async function ensureDefaultSequences(companyId: string) {
  for (const [language, steps, name] of [
    ["FR", FR_STEPS, "Séquence par défaut (Français)"],
    ["EN", EN_STEPS, "Default sequence (English)"],
  ] as const) {
    const existing = await prisma.followUpSequence.findFirst({
      where: { companyId, language, isDefault: true },
    });
    if (existing) continue;

    await prisma.followUpSequence.create({
      data: {
        companyId,
        name,
        language,
        active: true,
        isDefault: true,
        steps: {
          create: steps.map((step) => ({
            stepNumber: step.stepNumber,
            delayInDays: step.delayInDays,
            channel: "EMAIL",
            message: step.message,
            requiresApproval: false,
            active: true,
          })),
        },
      },
    });
  }
}
