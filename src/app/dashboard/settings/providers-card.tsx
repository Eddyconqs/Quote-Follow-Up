import { Badge } from "@/components/ui/badge";
import type { Dictionary, Locale } from "@/lib/i18n";

export function ProvidersCard({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const rows = [
    { label: dict.messageChannel.EMAIL, configured: !!process.env.EMAIL_PROVIDER_API_KEY },
    { label: dict.messageChannel.SMS, configured: !!process.env.SMS_PROVIDER_API_KEY },
    { label: "AI", configured: !!process.env.AI_PROVIDER_API_KEY },
  ];

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between text-sm">
          <span>{row.label}</span>
          <Badge variant={row.configured ? "success" : "muted"}>{row.configured ? "Configured" : "Mock"}</Badge>
        </div>
      ))}
      <p className="pt-1 text-xs text-muted-foreground">
        {locale === "fr"
          ? "Aucun message réel n'est envoyé tant qu'un fournisseur n'est pas configuré."
          : "No real messages are sent until a provider is configured."}
      </p>
    </div>
  );
}
