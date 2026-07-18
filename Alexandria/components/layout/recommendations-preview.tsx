"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";

type RecommendationsPreviewProps = {
  recommendations: string;
};

export function RecommendationsPreview({
  recommendations,
}: RecommendationsPreviewProps) {
  return (
    <div className="max-w-7xl">
      <Dialog>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Recommendations
          </h2>
          <DialogTrigger
            title="View full recommendations"
            aria-label="View full recommendations"
            className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            <Maximize2 size={16} aria-hidden="true" />
          </DialogTrigger>
        </div>

        <div className="mt-2">
          <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
            {recommendations}
          </p>
        </div>

        <DialogContent className="max-h-[82vh] max-w-3xl border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-text)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[var(--color-text)]">
              Recommendations
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full thesis recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[calc(82vh-6rem)] overflow-y-auto pr-2">
            <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-muted)]">
              {recommendations}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
