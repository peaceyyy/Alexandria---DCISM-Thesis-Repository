"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastTone = "success" | "error" | "info";

type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: number;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

const TONE_STYLES: Record<
  ToastTone,
  { container: string; icon: string; Icon: typeof CheckCircle2 }
> = {
  success: {
    container:
      "border-[var(--color-chip-green-bd)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_16px_40px_color-mix(in_oklch,var(--color-success)_14%,transparent)]",
    icon: "bg-[var(--color-chip-green-bg)] text-[var(--color-chip-green-text)]",
    Icon: CheckCircle2,
  },
  error: {
    container:
      "border-[var(--color-chip-red-bd)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-[0_16px_40px_color-mix(in_oklch,var(--color-danger)_14%,transparent)]",
    icon: "bg-[var(--color-chip-red-bg)] text-[var(--color-chip-red-text)]",
    Icon: CircleAlert,
  },
  info: {
    container:
      "border-[var(--color-chip-cyan-bd)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-lg",
    icon: "bg-[var(--color-chip-cyan-bg)] text-[var(--color-chip-cyan-text)]",
    Icon: Info,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const nextToastId = useRef(0);
  const [toast, setToast] = useState<ToastItem | null>(null);

  const showToast = useCallback((input: ToastInput) => {
    nextToastId.current += 1;
    setToast({
      ...input,
      id: nextToastId.current,
      tone: input.tone ?? "success",
    });
  }, []);

  const dismissToast = useCallback((toastId: number) => {
    setToast((current) => (current?.id === toastId ? null : current));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <FeedbackToast toast={toast} onDismiss={dismissToast} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

function FeedbackToast({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (toastId: number) => void;
}) {
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration ?? (toast.tone === "error" ? 7000 : 5000);
  const { container, icon, Icon } = TONE_STYLES[toast.tone];

  useEffect(() => {
    if (isPaused) {
      return;
    }

    const timeoutId = window.setTimeout(() => onDismiss(toast.id), duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, isPaused, onDismiss, toast.id]);

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[100] flex justify-end sm:left-auto sm:w-full sm:max-w-sm">
      <div
        role={toast.tone === "error" ? "alert" : "status"}
        aria-atomic="true"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocus={() => setIsPaused(true)}
        onBlur={() => setIsPaused(false)}
        className={`pointer-events-auto flex w-full items-start gap-3 rounded-[8px] border px-3 py-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-200 ${container}`}
      >
        <div
          className={`flex size-7 shrink-0 items-center justify-center rounded-full ${icon}`}
        >
          <Icon size={16} aria-hidden />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-semibold leading-5">{toast.title}</p>
          {toast.description ? (
            <p className="mt-0.5 leading-5 text-[var(--color-text-muted)]">
              {toast.description}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="-mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-[6px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] focus-visible:outline-none"
        >
          <X size={16} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
