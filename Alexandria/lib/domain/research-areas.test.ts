import { describe, expect, it } from "vitest";
import {
  isResearchAreaId,
  RESEARCH_AREA_IDS,
  RESEARCH_AREAS,
  serializeResearchAreaIds,
} from "./research-areas";

describe("research area presets", () => {
  it("uses the same canonical stored IDs for research-area controls", () => {
    expect(RESEARCH_AREAS.map((area) => area.id)).toEqual([...RESEARCH_AREA_IDS]);
  });

  it("rejects legacy display labels as submitted values", () => {
    expect(isResearchAreaId("Artificial Intelligence")).toBe(false);
    expect(isResearchAreaId("AI / ML")).toBe(false);
    expect(serializeResearchAreaIds(["Artificial Intelligence", "web_development"])).toBe(
      "web_development",
    );
  });
});
