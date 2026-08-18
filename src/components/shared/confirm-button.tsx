"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export function ConfirmButton({
  label,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  cancelLabel,
  onConfirm,
  variant = "outline",
  icon,
}: {
  label: string;
  confirmTitle: string;
  confirmDescription?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void>;
  variant?: ButtonProps["variant"];
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" variant={variant} size="sm" onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
            {confirmDescription && <DialogDescription>{confirmDescription}</DialogDescription>}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {cancelLabel}
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await onConfirm();
                  setOpen(false);
                })
              }
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
