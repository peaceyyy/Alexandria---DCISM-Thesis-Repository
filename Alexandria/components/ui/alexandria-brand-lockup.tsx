import Image from "next/image";
import { cn } from "@/lib/utils";

type AlexandriaBrandLockupProps = {
  markSize?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
  priority?: boolean;
};

/**
 * The compact product identity used by operational surfaces.
 *
 * Landing and authentication screens intentionally keep their own display-scale
 * treatments; this keeps the repeated header and sidebar lockups optically aligned.
 */
export function AlexandriaBrandLockup({
  markSize = 28,
  showWordmark = true,
  className,
  wordmarkClassName,
  priority = false,
}: AlexandriaBrandLockupProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-2.5 leading-none", className)}>
      <Image
        src="/brand/alexandria-mark.svg"
        width={markSize}
        height={markSize}
        alt=""
        className="block shrink-0 theme-invert"
        priority={priority}
      />
      {showWordmark ? (
        <span
          className={cn(
            "font-[var(--font-khula)] text-[15px] font-extrabold leading-none tracking-tight",
            wordmarkClassName,
          )}
        >
          ALEXANDRIA
        </span>
      ) : null}
    </span>
  );
}
