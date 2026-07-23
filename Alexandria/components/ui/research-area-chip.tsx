import { cn } from "@/lib/utils";
import {
  getResearchAreaLabel,
  getResearchAreaTone,
} from "@/lib/domain/research-areas";
import styles from "./research-area-chip.module.css";

type ResearchAreaChipProps = {
  area: string;
  size?: "compact" | "default";
  className?: string;
};

/** A consistent, subdued taxonomy label for a thesis research area. */
export function ResearchAreaChip({
  area,
  size = "default",
  className,
}: ResearchAreaChipProps) {
  const label = getResearchAreaLabel(area);
  const tone = getResearchAreaTone(area);

  return (
    <span
      title={label}
      className={cn(styles.chip, styles[tone], styles[size], className)}
    >
      {label}
    </span>
  );
}
