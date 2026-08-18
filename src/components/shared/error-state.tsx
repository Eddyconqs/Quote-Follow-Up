import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-12 text-center",
        className
      )}
    >
      <AlertTriangle className="mb-1 h-6 w-6 text-destructive" />
      <p className="text-sm font-medium text-destructive">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
