"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface SubmitConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function SubmitConfirmDialog({
  open,
  onCancel,
  onConfirm,
  isSubmitting,
}: SubmitConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isSubmitting) onCancel(); }}>
      <DialogContent
        showCloseButton={false}
        className="border-white/8 bg-[#1C2026] text-white sm:max-w-sm"
      >
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-[#368BFE]">
            <Send size={14} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              Ready to Submit
            </span>
          </div>
          <DialogTitle className="text-base font-semibold text-white">
            Submit your thesis for review?
          </DialogTitle>
          <DialogDescription className="text-white/45">
            Your submission will be sent to the Alexandria team. You will be notified once it has
            been reviewed — either approved or flagged with feedback.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t border-white/5 bg-transparent">
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="border border-white/10 text-white/60 hover:border-white/20 hover:text-white"
          >
            Review again
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-[#1752F0] text-white hover:bg-[#368BFE]"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting…
              </span>
            ) : (
              "Submit Thesis"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
