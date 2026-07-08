import { AppHeader } from "@/components/layout/app-header";
import FaqRail from "@/components/layout/faq";
import { getCurrentUser } from "@/lib/services/auth-service";
import { items } from "@/lib/mock-data/theses";
import Image from "next/image";
import Link from "next/link";
import DetailsSidebar from "@/components/layout/details-sidebar";

export default async function ThesisDetails({
    params
}: {
    params: Promise<{ thesisId: string }>;
}) {
    const { thesisId } = await params;
    const thesis = items.find((item) => item.id === Number(thesisId));
    const userResult = await getCurrentUser();
    const role = userResult.data?.role ?? null;

    console.log("thesisId:", thesisId);
    console.log("items ids:", items.map((item) => item.id));

    if (!thesis) {
        return <main>Thesis not found</main>;
    }

    return (
        <main className="h-screen overflow-hidden bg-[#14181c] text-white">
            <AppHeader role={role} />
            <div className="grid h-[calc(100vh-72px)] grid-cols-[220px_minmax(0,1fr)_360px]">
                <aside className="border-r border-white/15 px-3 py-4">
                    {/* left nav */}
                    <div>
                        <div className="mb-4 text-sm font-semibold text-white/60">Filter</div>

                        <section className="space-y-4 text-xs text-white/80">
                            <div>
                                <div className="mb-2 font-semibold">Year</div>
                                <div className="flex gap-2">
                                    <input className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none" placeholder="From" />
                                    <input className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none" placeholder="To" />
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 font-semibold">Research Area</div>
                                <div className="space-y-1">
                                    {["AI / ML", "Web Development", "Mobile Development", "Cybersecurity", "IoT", "Data Science"].map((item) => (
                                        <label key={item} className="flex items-center gap-2">
                                        <input type="checkbox" />
                                        <span>{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 font-semibold">Department</div>
                                <div className="space-y-1">
                                    {["Computer Science", "Information Technology", "Information Systems"].map((item) => (
                                        <label key={item} className="flex items-center gap-2">
                                        <input type="checkbox" />
                                        <span>{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </aside>

                <section className="overflow-y-auto px-6 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-r border-white/15">
                    {/* this section contains the back button, title, authors, abstract, keywords/tags, pdf viewer */}

                    <Link href="/theses" className="mb-4 inline-block text-blue-400 hover:text-blue-300">
                        ← Back
                    </Link>

                    <h1 className="max-w-7xl text-2xl font-extrabold leading-tight text-white">
                        {thesis.title}
                    </h1>

                    <div className="mt-2 text-sm text-white/70">
                        {thesis.authors.map((author) => author.name).join(" • ")} | {thesis.year}
                    </div>

                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-white">Abstract</h2>
                        <p className="mt-2 max-w-7xl text-sm leading-6 text-white/70">
                            {thesis.abstract}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-lg font-semibold text-white">Keywords</h2>
                        <p className="mt-2 max-w-7xl text-sm leading-6 text-white/70">
                            {/* Tags are here */}
                            {thesis.tags.join(", ")}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-center">
                        {/* PDF viewer will be put here */}
                        <Image
                            src="/placeholder.svg"
                            alt="Article preview"
                            width={1000}
                            height={360}
                        />
                    </div>
                </section>

                <DetailsSidebar thesis={thesis} allItems={items} />
            </div>
        </main>
    )
}