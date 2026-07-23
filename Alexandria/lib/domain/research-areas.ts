export const RESEARCH_AREA_IDS = [
  "ai_engineering",
  "machine_learning",
  "web_development",
  "mobile_development",
  "cybersecurity",
  "iot",
  "data_science",
  "networking",
  "algorithms",
  "mathematics",
] as const;

export type ResearchAreaId = (typeof RESEARCH_AREA_IDS)[number];
export type ResearchAreaTone =
  | "cyan"
  | "blue"
  | "teal"
  | "indigo"
  | "amber"
  | "green"
  | "yellow"
  | "purple"
  | "pink"
  | "orange";

export const RESEARCH_AREAS: ReadonlyArray<{
  id: ResearchAreaId;
  label: string;
  tone: ResearchAreaTone;
}> = [
  { id: "ai_engineering", label: "AI Engineering", tone: "cyan" },
  { id: "machine_learning", label: "Machine Learning", tone: "indigo" },
  { id: "web_development", label: "Web Development", tone: "blue" },
  { id: "mobile_development", label: "Mobile Development", tone: "yellow" },
  { id: "cybersecurity", label: "Cybersecurity", tone: "purple" },
  { id: "iot", label: "IoT", tone: "orange" },
  { id: "data_science", label: "Data Science", tone: "green" },
  { id: "networking", label: "Networking", tone: "teal" },
  { id: "algorithms", label: "Algorithms", tone: "pink" },
  { id: "mathematics", label: "Mathematics", tone: "amber" },
] as const;

const LEGACY_RESEARCH_AREA_IDS: Record<string, ResearchAreaId> = {
  "AI / Machine Learning": "ai_engineering",
  "Artificial Intelligence": "ai_engineering",
  "Web Development": "web_development",
  "Mobile Development": "mobile_development",
  Cybersecurity: "cybersecurity",
  IoT: "iot",
  "Data Science": "data_science",
  Networking: "networking",
  Algorithms: "algorithms",
  Mathematics: "mathematics",
};

export function isResearchAreaId(value: unknown): value is ResearchAreaId {
  return (
    typeof value === "string" &&
    (RESEARCH_AREA_IDS as readonly string[]).includes(value)
  );
}

export function getResearchAreaLabel(value: string): string {
  return RESEARCH_AREAS.find((area) => area.id === value)?.label ?? value;
}

export function getResearchAreaTone(value: string): ResearchAreaTone {
  const normalizedValue = LEGACY_RESEARCH_AREA_IDS[value] ?? value;
  return RESEARCH_AREAS.find((area) => area.id === normalizedValue)?.tone ?? "cyan";
}

export function formatResearchAreaLabels(value: string | null | undefined): string {
  return value
    ? value
        .split(",")
        .map((part) => getResearchAreaLabel(part.trim()))
        .filter(Boolean)
        .join(", ")
    : "";
}

export function parseResearchAreaIds(value: string | null | undefined): ResearchAreaId[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(",")
        .map((part) => part.trim())
        .map((part) => LEGACY_RESEARCH_AREA_IDS[part] ?? part)
        .filter(isResearchAreaId),
    ),
  );
}

export function serializeResearchAreaIds(values: readonly string[]): string {
  return Array.from(new Set(values.filter(isResearchAreaId))).join(",");
}

export function isSerializedResearchAreaIds(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    parseResearchAreaIds(value).join(",") === value
  );
}
