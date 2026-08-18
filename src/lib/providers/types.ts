export interface SendResult {
  status: "sent" | "failed";
  providerMessageId?: string;
  failureReason?: string;
}

export interface EmailProvider {
  send(input: { to: string; subject: string; body: string; language: "FR" | "EN" }): Promise<SendResult>;
}

export interface SmsProvider {
  send(input: { to: string; body: string; language: "FR" | "EN" }): Promise<SendResult>;
}

export interface ImportedQuote {
  externalId: string;
  customerName: string;
  amount: number;
  title: string;
}

export interface CrmProvider {
  importQuotes(companyId: string): Promise<ImportedQuote[]>;
}

export interface InvoiceDraftResult {
  externalSystem: string;
  externalId: string;
  syncStatus: "synced" | "not_configured" | "failed";
}

export interface AccountingProvider {
  createInvoiceDraft(input: { jobHandoffId: string; amount: number; currency: string }): Promise<InvoiceDraftResult>;
}

export type ReplyClassificationResult = {
  classification:
    | "INTERESTED"
    | "QUESTION"
    | "PRICE_OBJECTION"
    | "WANTS_TO_SCHEDULE"
    | "NOT_NOW"
    | "DECLINED"
    | "UNCLEAR";
  confidence: number;
  requiresHumanAttention: boolean;
};

export interface AiProvider {
  generateFollowUpDraft(input: {
    customerFirstName: string;
    quoteTitle: string;
    quoteAmount: string;
    language: "FR" | "EN";
    context?: string;
  }): Promise<{ draft: string }>;
  classifyReply(body: string, language: "FR" | "EN"): Promise<ReplyClassificationResult>;
  suggestLostReason(activitySummary: string): Promise<{ reason: string; rationale: string }>;
  summarizeQuoteActivity(activityDescriptions: string[], language: "FR" | "EN"): Promise<{ summary: string }>;
}
