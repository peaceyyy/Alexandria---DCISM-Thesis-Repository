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

export const RESEARCH_AREAS: ReadonlyArray<{
  id: ResearchAreaId;
  label: string;
}> = [
  { id: "ai_engineering", label: "AI Engineering" },
  { id: "machine_learning", label: "Machine Learning" },
  { id: "web_development", label: "Web Development" },
  { id: "mobile_development", label: "Mobile Development" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "iot", label: "IoT" },
  { id: "data_science", label: "Data Science" },
  { id: "networking", label: "Networking" },
  { id: "algorithms", label: "Algorithms" },
  { id: "mathematics", label: "Mathematics" },
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
