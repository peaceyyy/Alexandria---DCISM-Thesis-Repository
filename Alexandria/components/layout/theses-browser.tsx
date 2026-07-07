"use client";

import { useState } from "react";
import type React from "react";
import Image from "next/image";
import FaqRail from "@/components/layout/faq";
import FilterSidebar from "@/components/layout/filter-sidebar";

type ThesisItem = {
  authors: { id: string; name: string }[];
  year: number;
  title: string;
  abstract: string;
  research_area: string[];
  department: string;
};

type ThesesBrowserProps = {
  items: ThesisItem[];
};

export default function ThesesBrowser({ items }: ThesesBrowserProps) {
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>(
    []
  );
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const filteredItems = items.filter((item) => {
    const yearMatch =
      (!fromYear || item.year >= Number(fromYear)) &&
      (!toYear || item.year <= Number(toYear));

    const researchAreaMatch =
      selectedResearchAreas.length === 0 ||
      selectedResearchAreas.some((area) =>
        item.research_area.includes(area)
      );

    const departmentMatch =
      selectedDepartments.length === 0 ||
      selectedDepartments.includes(item.department);

    return yearMatch && researchAreaMatch && departmentMatch;
  });

  const toggleValue = (
    value: string,
    setValues: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setValues((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
  };

  return (
    <div className="grid h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
      <FilterSidebar
        fromYear={fromYear}
        toYear={toYear}
        setFromYear={setFromYear}
        setToYear={setToYear}
        selectedResearchAreas={selectedResearchAreas}
        selectedDepartments={selectedDepartments}
        onToggleResearchArea={(value) =>
          toggleValue(value, setSelectedResearchAreas)
        }
        onToggleDepartment={(value) =>
          toggleValue(value, setSelectedDepartments)
        }
      />

      <section className="border-r border-white/15 px-4 py-5 lg:px-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <article
              key={item.title}
              className="group rounded-xl border border-white/15 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.06]"
            >
              <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <Image
                  src="/placeholder.svg"
                  alt="Article preview"
                  width={640}
                  height={360}
                  className="h-36 w-full object-cover"
                />
              </div>

              <div className="mb-2 text-[11px] uppercase tracking-wide text-white/50">
                {item.authors.map((a) => a.name).join(" • ")} | {item.year}
              </div>

              <h2 className="text-base font-extrabold leading-tight text-white">
                {item.title}
              </h2>

              <p className="mt-2 line-clamp-3 text-sm leading-5 text-white/70">
                {item.abstract}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.research_area.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#1da0c9]/50 bg-[#1da0c9]/10 px-2 py-0.5 text-[11px] font-medium text-[#9ddff2]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <FaqRail />
    </div>
  );
}