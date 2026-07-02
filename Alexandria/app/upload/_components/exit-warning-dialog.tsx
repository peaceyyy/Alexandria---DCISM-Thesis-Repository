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
import { TriangleAlert } from "lucide-react";

interface ExitWarningDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function ExitWarningDialog({ open, onStay, onLeave }: ExitWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onStay(); }}>
      <DialogContent
        showCloseButton={false}
        className="border-white/8 bg-[#1C2026] text-white sm:max-w-sm"
      >
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2 text-[#ff6b6b]">
            <TriangleAlert size={15} aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-widest">
              Unsaved Changes
            </span>
          </div>
          <DialogTitle className="text-base font-semibold text-white">
            Leave the submission form?
          </DialogTitle>
          <DialogDescription className="text-white/45">
            Your progress will be lost. This action cannot be undone — you will need to start
            the form again from scratch.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="border-t border-white/5 bg-transparent">
          <Button
            variant="ghost"
            onClick={onStay}
            className="border border-white/10 text-white/60 hover:border-white/20 hover:text-white"
          >
            Stay on page
          </Button>
          <Button
            onClick={onLeave}
            className="bg-[#ff6b6b]/15 text-[#ff6b6b] hover:bg-[#ff6b6b]/25"
          >
            Leave anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
