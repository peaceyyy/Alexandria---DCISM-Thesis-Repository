"use client";

type FilterSidebarProps = {
  fromYear: string;
  toYear: string;
  setFromYear: (value: string) => void;
  setToYear: (value: string) => void;
  selectedResearchAreas: string[];
  selectedDepartments: string[];
  onToggleResearchArea: (value: string) => void;
  onToggleDepartment: (value: string) => void;
};

const researchAreas = [
  "AI / ML",
  "Web Development",
  "Mobile Development",
  "Cybersecurity",
  "IoT",
  "Data Science",
];

const departments = [
  "Computer Science",
  "Information Technology",
  "Information Systems",
];

export default function FilterSidebar({
  fromYear,
  toYear,
  setFromYear,
  setToYear,
  selectedResearchAreas,
  selectedDepartments,
  onToggleResearchArea,
  onToggleDepartment,
}: FilterSidebarProps) {
  return (
    <aside className="border-r border-white/15 px-3 py-4">
      <div className="mb-4 text-sm font-semibold text-white/60">Filter</div>

      <section className="space-y-4 text-xs text-white/80">
        <div>
          <div className="mb-2 font-semibold">Year</div>
          <div className="flex gap-2">
            <input
              value={fromYear}
              onChange={(e) => setFromYear(e.target.value)}
              className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none"
              placeholder="From"
            />
            <input
              value={toYear}
              onChange={(e) => setToYear(e.target.value)}
              className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none"
              placeholder="To"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 font-semibold">Research Area</div>
          <div className="space-y-1">
            {researchAreas.map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedResearchAreas.includes(item)}
                  onChange={() => onToggleResearchArea(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 font-semibold">Department</div>
          <div className="space-y-1">
            {departments.map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedDepartments.includes(item)}
                  onChange={() => onToggleDepartment(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
}