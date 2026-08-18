import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_OWNER_EMAIL = "demo@quotefollowup.app";
const DEMO_PASSWORD = "Demo1234!";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  // Idempotent: wipe any previous demo company (cascades to every related row) before recreating it.
  const existing = await prisma.user.findUnique({ where: { email: DEMO_OWNER_EMAIL } });
  if (existing) {
    await prisma.company.delete({ where: { id: existing.companyId } });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const company = await prisma.company.create({
    data: {
      name: "Solutions CVC Lavoie",
      businessType: "HVAC",
      email: "info@cvclavoie.example",
      phone: "514-555-0182",
      address: "1245 Rue Principale, Longueuil, QC",
      defaultLanguage: "FR",
      defaultCurrency: "CAD",
      timeZone: "America/Toronto",
      businessHours: { start: 8, end: 17, days: [1, 2, 3, 4, 5] },
      approvalMode: false,
      isDemo: true,
    },
  });

  const owner = await prisma.user.create({
    data: {
      name: "Marc-André Lavoie",
      email: DEMO_OWNER_EMAIL,
      passwordHash,
      role: "OWNER",
      companyId: company.id,
      preferredLanguage: "FR",
    },
  });

  const staff = await prisma.user.create({
    data: {
      name: "Isabelle Roy",
      email: "isabelle@cvclavoie.example",
      passwordHash: await bcrypt.hash("Demo1234!", 12),
      role: "STAFF",
      companyId: company.id,
      preferredLanguage: "FR",
    },
  });

  const frSequence = await prisma.followUpSequence.create({
    data: {
      companyId: company.id,
      name: "Séquence par défaut (Français)",
      language: "FR",
      active: true,
      isDefault: true,
      steps: {
        create: [
          {
            stepNumber: 1,
            delayInDays: 0,
            channel: "EMAIL",
            message:
              "Bonjour {{firstName}}, nous vous avons envoyé une soumission pour {{quoteTitle}}. Avez-vous eu la chance de la consulter? Nous sommes disponibles si vous avez des questions.",
          },
          {
            stepNumber: 2,
            delayInDays: 3,
            channel: "EMAIL",
            message:
              "Bonjour {{firstName}}, je fais un suivi concernant votre soumission de {{quoteAmount}} pour {{quoteTitle}}. Souhaitez-vous que nous répondions à vos questions ou que nous réservions une date?",
          },
          {
            stepNumber: 3,
            delayInDays: 7,
            channel: "EMAIL",
            message:
              "Bonjour {{firstName}}, notre soumission est toujours disponible. Si votre projet est reporté ou si vous avez choisi une autre option, vous pouvez simplement nous le dire. Merci!",
          },
        ],
      },
    },
    include: { steps: true },
  });

  const enSequence = await prisma.followUpSequence.create({
    data: {
      companyId: company.id,
      name: "Default sequence (English)",
      language: "EN",
      active: true,
      isDefault: true,
      steps: {
        create: [
          {
            stepNumber: 1,
            delayInDays: 0,
            channel: "EMAIL",
            message: "Hi {{firstName}}, we sent you a quote for {{quoteTitle}}. Did you have a chance to review it? We're happy to answer any questions.",
          },
          {
            stepNumber: 2,
            delayInDays: 3,
            channel: "EMAIL",
            message: "Hi {{firstName}}, I'm following up about your {{quoteAmount}} quote for {{quoteTitle}}. Would you like us to answer any questions or reserve a date?",
          },
          {
            stepNumber: 3,
            delayInDays: 7,
            channel: "EMAIL",
            message: "Hi {{firstName}}, our quote is still available. If your project has been postponed or you chose another option, just let us know. Thank you!",
          },
        ],
      },
    },
    include: { steps: true },
  });

  const [sophie, jeanPhilippe, ling, marc, amanda] = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: company.id,
        firstName: "Sophie",
        lastName: "Bergeron",
        email: "sophie.bergeron@example.com",
        phone: "450-555-0101",
        preferredLanguage: "FR",
        address: "22 Rue des Érables, Longueuil, QC",
        emailConsent: true,
        smsConsent: true,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        firstName: "Jean-Philippe",
        lastName: "Roy",
        email: "jp.roy@example.com",
        phone: "450-555-0102",
        preferredLanguage: "FR",
        emailConsent: true,
        smsConsent: false,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        firstName: "Ling",
        lastName: "Chen",
        email: "ling.chen@example.com",
        phone: "514-555-0103",
        preferredLanguage: "EN",
        emailConsent: true,
        smsConsent: true,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        firstName: "Marc",
        lastName: "Fontaine",
        email: "marc.fontaine@example.com",
        preferredLanguage: "FR",
        emailConsent: false,
        smsConsent: false,
      },
    }),
    prisma.customer.create({
      data: {
        companyId: company.id,
        firstName: "Amanda",
        lastName: "Wilson",
        email: "amanda.wilson@example.com",
        phone: "514-555-0105",
        preferredLanguage: "EN",
        emailConsent: true,
        smsConsent: true,
      },
    }),
  ]);

  let quoteCounter = 1;
  function nextQuoteNumber() {
    return `Q-DEMO-${String(quoteCounter++).padStart(3, "0")}`;
  }

  async function logActivity(quoteId: string, type: Parameters<typeof prisma.activity.create>[0]["data"]["type"], description: string) {
    await prisma.activity.create({ data: { companyId: company.id, quoteId, userId: owner.id, type, description } });
  }

  // Q1 — active follow-up, overdue next step (dashboard: "follow-up overdue")
  const q1 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: sophie.id,
      quoteNumber: nextQuoteNumber(),
      title: "Remplacement thermopompe",
      serviceType: "HVAC",
      amount: "6800",
      currency: "CAD",
      language: "FR",
      quoteDate: daysAgo(6),
      status: "FOLLOW_UP_SCHEDULED",
      followUpStatus: "ACTIVE",
      nextFollowUpAt: daysAgo(1),
      source: "MANUAL",
      assignedUserId: owner.id,
    },
  });
  await prisma.followUpEnrollment.create({
    data: { companyId: company.id, quoteId: q1.id, sequenceId: frSequence.id, status: "ACTIVE", currentStep: 2, nextRunAt: daysAgo(1), startedAt: daysAgo(6) },
  });
  await prisma.message.create({
    data: {
      companyId: company.id,
      quoteId: q1.id,
      customerId: sophie.id,
      followUpStepId: frSequence.steps[0].id,
      channel: "EMAIL",
      direction: "OUTBOUND",
      status: "SENT",
      subject: "Suivi: Remplacement thermopompe",
      body: "Bonjour Sophie, nous vous avons envoyé une soumission pour Remplacement thermopompe. Avez-vous eu la chance de la consulter?",
      sentAt: daysAgo(6),
      deliveredAt: daysAgo(6),
      providerMessageId: "mock-seed-1",
    },
  });
  await prisma.message.create({
    data: {
      companyId: company.id,
      quoteId: q1.id,
      customerId: sophie.id,
      followUpStepId: frSequence.steps[1].id,
      channel: "EMAIL",
      direction: "OUTBOUND",
      status: "SENT",
      subject: "Suivi: Remplacement thermopompe",
      body: "Bonjour Sophie, je fais un suivi concernant votre soumission de 6 800,00 $ pour Remplacement thermopompe.",
      sentAt: daysAgo(3),
      deliveredAt: daysAgo(3),
      providerMessageId: "mock-seed-2",
    },
  });
  await logActivity(q1.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q1.id, "FOLLOW_UP_ACTIVATED", "Follow-up sequence activated.");
  await logActivity(q1.id, "MESSAGE_SENT", "EMAIL follow-up sent (step 1).");
  await logActivity(q1.id, "MESSAGE_SENT", "EMAIL follow-up sent (step 2).");

  // Q2 — sent, no follow-up activated (dashboard: "no follow-up scheduled")
  const q2 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: jeanPhilippe.id,
      quoteNumber: nextQuoteNumber(),
      title: "Réparation de fuite",
      serviceType: "PLUMBING",
      amount: "850",
      currency: "CAD",
      language: "FR",
      quoteDate: daysAgo(2),
      status: "SENT",
      followUpStatus: "NONE",
      source: "PHONE_CALL",
    },
  });
  await logActivity(q2.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q2.id, "QUOTE_SENT", "Quote sent to customer.");

  // Q3 — customer replied with a question (dashboard: "customer asked a question")
  const q3 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: ling.id,
      quoteNumber: nextQuoteNumber(),
      title: "Electrical panel upgrade",
      serviceType: "ELECTRICAL",
      amount: "3200",
      currency: "CAD",
      language: "EN",
      quoteDate: daysAgo(4),
      status: "CUSTOMER_REPLIED",
      followUpStatus: "CANCELLED",
      source: "WEBSITE_FORM",
    },
  });
  const q3OutboundMsg = await prisma.message.create({
    data: {
      companyId: company.id,
      quoteId: q3.id,
      customerId: ling.id,
      followUpStepId: enSequence.steps[0].id,
      channel: "EMAIL",
      direction: "OUTBOUND",
      status: "REPLIED",
      subject: "Follow-up: Electrical panel upgrade",
      body: "Hi Ling, we sent you a quote for Electrical panel upgrade. Did you have a chance to review it?",
      sentAt: daysAgo(4),
      deliveredAt: daysAgo(4),
      repliedAt: daysAgo(1),
    },
  });
  const q3Inbound = await prisma.message.create({
    data: {
      companyId: company.id,
      quoteId: q3.id,
      customerId: ling.id,
      channel: "EMAIL",
      direction: "INBOUND",
      status: "REPLIED",
      body: "Does this quote include the permit fees with the city?",
      repliedAt: daysAgo(1),
    },
  });
  await prisma.customerReply.create({
    data: {
      companyId: company.id,
      quoteId: q3.id,
      customerId: ling.id,
      messageId: q3Inbound.id,
      body: "Does this quote include the permit fees with the city?",
      classification: "QUESTION",
      confidence: 0.6,
      requiresHumanAttention: true,
    },
  });
  await logActivity(q3.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q3.id, "FOLLOW_UP_ACTIVATED", "Follow-up sequence activated.");
  await logActivity(q3.id, "MESSAGE_SENT", "EMAIL follow-up sent (step 1).");
  await logActivity(q3.id, "CUSTOMER_REPLIED", "Customer replied — classified as QUESTION.");
  await logActivity(q3.id, "FOLLOW_UP_CANCELLED", "Follow-up sequence cancelled: customer replied.");
  void q3OutboundMsg;

  // Q4 — open too long, sequence completed with no reply (dashboard: "open for more than 14 days")
  const q4 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: marc.id,
      quoteNumber: nextQuoteNumber(),
      title: "Rénovation sous-sol",
      serviceType: "RENOVATION",
      amount: "22000",
      currency: "CAD",
      language: "FR",
      quoteDate: daysAgo(20),
      status: "SENT",
      followUpStatus: "COMPLETED",
      source: "MANUAL",
    },
  });
  await logActivity(q4.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q4.id, "FOLLOW_UP_ACTIVATED", "Follow-up sequence activated.");
  await logActivity(q4.id, "FOLLOW_UP_CANCELLED", "Follow-up sequence completed with no reply.");

  // Q5 — won this month, ready-for-scheduling handoff
  const q5 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: amanda.id,
      quoteNumber: nextQuoteNumber(),
      title: "AC installation",
      serviceType: "HVAC",
      amount: "5400",
      currency: "CAD",
      language: "EN",
      quoteDate: daysAgo(10),
      status: "WON",
      followUpStatus: "CANCELLED",
      wonAt: daysAgo(1),
      source: "MANUAL",
    },
  });
  await prisma.jobHandoff.create({
    data: {
      companyId: company.id,
      quoteId: q5.id,
      customerId: amanda.id,
      status: "READY_FOR_SCHEDULING",
      serviceType: "HVAC",
      notes: "Customer prefers morning appointments.",
      assignedUserId: staff.id,
    },
  });
  await logActivity(q5.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q5.id, "QUOTE_WON", "Quote marked won.");
  await logActivity(q5.id, "JOB_HANDOFF_CREATED", "Job handoff created for won quote.");

  // Q6 — lost, too expensive
  const q6 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: sophie.id,
      quoteNumber: nextQuoteNumber(),
      title: "Remplacement chauffe-eau",
      serviceType: "PLUMBING",
      amount: "1200",
      currency: "CAD",
      language: "FR",
      quoteDate: daysAgo(15),
      status: "LOST",
      followUpStatus: "CANCELLED",
      lostAt: daysAgo(5),
      lostReason: "TOO_EXPENSIVE",
      source: "MANUAL",
    },
  });
  await logActivity(q6.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q6.id, "QUOTE_LOST", "Quote marked lost: TOO_EXPENSIVE.");

  // Q7 — customer replied with a price objection
  const q7 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: jeanPhilippe.id,
      quoteNumber: nextQuoteNumber(),
      title: "Réparation de toiture",
      serviceType: "ROOFING",
      amount: "4500",
      currency: "CAD",
      language: "FR",
      quoteDate: daysAgo(5),
      status: "CUSTOMER_REPLIED",
      followUpStatus: "CANCELLED",
      source: "MANUAL",
    },
  });
  const q7Inbound = await prisma.message.create({
    data: {
      companyId: company.id,
      quoteId: q7.id,
      customerId: jeanPhilippe.id,
      channel: "EMAIL",
      direction: "INBOUND",
      status: "REPLIED",
      body: "C'est pas mal plus cher que ce qu'on pensait, le prix est-il négociable?",
      repliedAt: daysAgo(2),
    },
  });
  await prisma.customerReply.create({
    data: {
      companyId: company.id,
      quoteId: q7.id,
      customerId: jeanPhilippe.id,
      messageId: q7Inbound.id,
      body: "C'est pas mal plus cher que ce qu'on pensait, le prix est-il négociable?",
      classification: "PRICE_OBJECTION",
      confidence: 0.75,
      requiresHumanAttention: true,
    },
  });
  await logActivity(q7.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q7.id, "CUSTOMER_REPLIED", "Customer replied — classified as PRICE_OBJECTION.");

  // Q8 — draft, not yet sent
  await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: ling.id,
      quoteNumber: nextQuoteNumber(),
      title: "Landscaping design",
      serviceType: "LANDSCAPING",
      amount: "9800",
      currency: "CAD",
      language: "EN",
      quoteDate: new Date(),
      status: "DRAFT",
      followUpStatus: "NONE",
      source: "MANUAL",
    },
  });

  // Q9 — expires soon
  const q9 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: amanda.id,
      quoteNumber: nextQuoteNumber(),
      title: "Contrat d'entretien commercial",
      serviceType: "COMMERCIAL_MAINTENANCE",
      amount: "15000",
      currency: "CAD",
      language: "EN",
      quoteDate: daysAgo(3),
      expirationDate: daysFromNow(2),
      status: "FOLLOW_UP_SCHEDULED",
      followUpStatus: "ACTIVE",
      nextFollowUpAt: daysFromNow(2),
      source: "CRM_INTEGRATION",
    },
  });
  await prisma.followUpEnrollment.create({
    data: { companyId: company.id, quoteId: q9.id, sequenceId: enSequence.id, status: "ACTIVE", currentStep: 1, nextRunAt: daysFromNow(2), startedAt: daysAgo(3) },
  });
  await logActivity(q9.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q9.id, "FOLLOW_UP_ACTIVATED", "Follow-up sequence activated.");

  // Q10 — won last month (historical, no handoff yet)
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const q10 = await prisma.quote.create({
    data: {
      companyId: company.id,
      customerId: marc.id,
      quoteNumber: nextQuoteNumber(),
      title: "Entretien climatiseur",
      serviceType: "HVAC",
      amount: "650",
      currency: "CAD",
      language: "FR",
      quoteDate: lastMonth,
      status: "WON",
      followUpStatus: "CANCELLED",
      wonAt: lastMonth,
      source: "MANUAL",
    },
  });
  await logActivity(q10.id, "QUOTE_CREATED", "Quote created.");
  await logActivity(q10.id, "QUOTE_WON", "Quote marked won.");

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  // eslint-disable-next-line no-console
  console.log(`Demo login: ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
