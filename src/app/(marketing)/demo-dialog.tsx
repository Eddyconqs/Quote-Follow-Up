"use client";

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProductShowcase } from "./product-showcase";
import type { Dictionary } from "@/lib/i18n";

export function DemoDialogTrigger({ dict }: { dict: Dictionary }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline">
          {dict.landing.ctaSecondary}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dict.landing.ctaSecondary}</DialogTitle>
        </DialogHeader>
        <ProductShowcase dict={dict} />
      </DialogContent>
    </Dialog>
  );
}
