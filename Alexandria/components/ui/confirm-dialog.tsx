import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmDialogIntent = "default" | "outline" | "secondary" | "destructive";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmIntent: ConfirmDialogIntent;
  confirmIcon?: ReactNode;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Shared shell for an already-confirmed action; callers retain the decision logic. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmIntent,
  confirmIcon,
  isSubmitting = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSubmitting) onCancel();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-text)]"
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--color-text)]">{title}</DialogTitle>
          <DialogDescription className="leading-6 text-[var(--color-text-muted)]">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="border-[var(--color-separator)] bg-[var(--color-surface-alt)]">
          <Button type="button" variant="outline" size="lg" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmIntent}
            size="lg"
            onClick={onConfirm}
            isLoading={isSubmitting}
            loadingLabel="Working…"
          >
            {!isSubmitting ? confirmIcon : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
