import "server-only";
import type { AccountingProvider, InvoiceDraftResult } from "@/lib/providers/types";

/**
 * No accounting integration is implemented in the MVP (by design — QuoteFollowUp
 * never becomes a general ledger, never files tax, never runs payroll). This stub
 * keeps the JobHandoff -> external invoice-draft seam visible for QuickBooks/Sage/
 * Xero integrations without pretending to sync anything.
 */
class NotConfiguredAccountingProvider implements AccountingProvider {
  async createInvoiceDraft(_input: { jobHandoffId: string; amount: number; currency: string }): Promise<InvoiceDraftResult> {
    return { externalSystem: "none", externalId: "", syncStatus: "not_configured" };
  }
}

export function getAccountingProvider(): AccountingProvider {
  return new NotConfiguredAccountingProvider();
}
