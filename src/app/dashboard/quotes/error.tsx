"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";

export default function QuotesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="space-y-4">
      <ErrorState title="Une erreur est survenue lors du chargement des soumissions." />
      <Button onClick={reset} variant="outline">
        Réessayer
      </Button>
    </div>
  );
}
