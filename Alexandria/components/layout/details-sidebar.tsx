import Link from "next/link";

type ThesisItem = {
  id: number;
  authors: { id: string; name: string }[];
  year: number;
  title: string;
  abstract: string;
  research_area: string[];
  department: string;
  lessons_learned: string[];
};

type SelectedRightRailProps = {
  thesis: ThesisItem;
  allItems: ThesisItem[];
};

export default function DetailsSidebar({
  thesis,
  allItems,
}: SelectedRightRailProps) {
  const recommendedArticles = allItems
    .filter((item) => item.id !== thesis.id)
    .filter(
      (item) =>
        item.department === thesis.department ||
        item.research_area.some((area) => thesis.research_area.includes(area))
    )
    .slice(0, 3);

  return (
    <aside className="border-l border-white/15 px-4 py-6 lg:px-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="rounded-xl border border-[#416790] bg-[linear-gradient(315deg,#2B435E_0%,#131E2A_100%)] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <h3 className="text-lg font-extrabold text-white">Lessons Learned</h3>

        <ul className="mt-3 space-y-3 text-sm leading-5 text-white/75">
          {thesis.lessons_learned.map((lesson, index) => (
            <li key={index}>{lesson}</li>
          ))}
        </ul>

        <div className="mt-5">
          <h4 className="text-base font-semibold text-white">Research Area</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {thesis.research_area.map((area) => (
              <span
                key={area}
                className="inline-flex items-center rounded-full border border-white/30 bg-transparent px-3 py-1 text-[11px] text-white/80"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-white">Recommended Articles</h3>

        <div className="mt-4 space-y-4">
          {recommendedArticles.map((item) => (
            <Link key={item.id} href={`/theses/${item.id}`} className="block">
              <article className="border-b border-white/20 pb-4 transition hover:opacity-80">
                <h4 className="text-base font-semibold text-[#2f8dff]">
                  {item.title}
                </h4>
                <p className="mt-1 text-sm text-white/60">
                  {item.authors.map((author) => author.name).join(" • ")}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}