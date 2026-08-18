import "server-only";
import type { CrmProvider, ImportedQuote } from "@/lib/providers/types";

/**
 * No CRM integration is implemented in the MVP. This stub keeps the interface
 * visible for future Jobber/CSV-import work without pretending to import anything.
 */
class NotConfiguredCrmProvider implements CrmProvider {
  async importQuotes(_companyId: string): Promise<ImportedQuote[]> {
    return [];
  }
}

export function getCrmProvider(): CrmProvider {
  return new NotConfiguredCrmProvider();
}
