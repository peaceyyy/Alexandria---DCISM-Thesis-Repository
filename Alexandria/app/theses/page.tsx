import { AppHeader } from "@/components/layout/app-header";
import ThesesBrowser from "@/components/layout/theses-browser";
import { getCurrentUser } from "@/lib/services/auth-service";
import { items } from "@/lib/mock-data/theses";

export default async function ThesesPage() {
  const userResult = await getCurrentUser();
  const role = userResult.data?.role ?? null;

  return (
    <main className="h-screen overflow-hidden bg-[#14181c] text-white">
      <AppHeader role={role} />
      <ThesesBrowser items={items} />
    </main>
  );
}






// import { AppHeader } from "@/components/layout/app-header";
// import FaqRail from "@/components/layout/faq";
// import { getCurrentUser } from "@/lib/services/auth-service";
// import Image from "next/image";

// const items = [
//   {
//     authors: [
//       {
//         id: "james-ang",
//         name: "James Ang"
//       },
//       {
//         id: "jared-minoza",
//         name: "Jared Minoza"
//       }
//     ],
//     year: 2025,
//     title: "AI-Based Student Attendance Monitoring Using Facial Recognition",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["AI / ML", "Data Science"],
//     department: "Computer Science"
//   },
//   {
//     authors: [
//       {
//         id: "avryl-joie",
//         name: "Avryl Joie Arranguez"
//       },
//       {
//         id: "homer-dorin",
//         name: "Homer Adriel Dorin"
//       }
//     ],
//     year: 2023,
//     title: "A Mobile Inventory Management System for Small Businesses",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["Mobile Development", "Cybersecurity"],
//     department: "Information Technology"
//   },
//   {
//     authors: [
//       {
//         id: "matt-erron",
//         name: "Matt Erron Cabarrubias"
//       },
//       {
//         id: "dustin-jesse",
//         name: "Dustin Jesse Balansag"
//       }
//     ],
//     year: 2025,
//     title: "Cybersecurity Risk Assessment Framework for Small Enterprises",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["Web Development", "Data Science"],
//     department: "Information Systems"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["AI / ML", "Data Science"],
//     department: "Information Technology"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["AI / ML", "Data Science"],
//     department: "Computer Science"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["IoT", "Data Science"],
//     department: "Computer Science"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["AI / ML", "Data Science"],
//     department: "Information Technology"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["IoT", "Data Science"],
//     department: "Information Systems"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["AI / ML", "Data Science"],
//     department: "Information Systems"
//   },
//   {
//     authors: [
//       {
//         id: "leira-bengil",
//         name: "Leira Bengil"
//       },
//       {
//         id: "jian-bryce",
//         name: "Jian Bryce Machacon"
//       }
//     ],
//     year: 2024,
//     title: "Project Title",
//     abstract: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim  veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea  commodo consequat. Duis aute irure dolor in reprehenderit in voluptate  velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint  occaecat cupidatat non proident, sunt in culpa qui officia deserunt  mollit anim id est laborum",
//     research_area: ["AI / ML", "Data Science"],
//     department: "Computer Science"
//   },
// ]

// export default async function ThesesPage() {
//   const userResult = await getCurrentUser();
//   const role = userResult.data?.role ?? null;

//   return (
//     <main className="h-screen overflow-hidden bg-[#14181c] text-white">
//       <AppHeader role={role} />
//       <div className="grid h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_360px]">
//         <aside className="border-r border-white/15 px-3 py-4">

//           <div className="">
//             <div className="mb-4 text-sm font-semibold text-white/60">Filter</div>

//             <section className="space-y-4 text-xs text-white/80">
//               <div>
//                 <div className="mb-2 font-semibold">Year</div>
//                 <div className="flex gap-2">
//                   <input className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none" placeholder="From" />
//                   <input className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none" placeholder="To" />
//                 </div>
//               </div>

//               <div>
//                 <div className="mb-2 font-semibold">Research Area</div>
//                 <div className="space-y-1">
//                   {["AI / ML", "Web Development", "Mobile Development", "Cybersecurity", "IoT", "Data Science"].map((item) => (
//                     <label key={item} className="flex items-center gap-2">
//                       <input type="checkbox" />
//                       <span>{item}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <div>
//                 <div className="mb-2 font-semibold">Department</div>
//                 <div className="space-y-1">
//                   {["Computer Science", "Information Technology", "Information System"].map((item) => (
//                     <label key={item} className="flex items-center gap-2">
//                       <input type="checkbox" />
//                       <span>{item}</span>
//                     </label>
//                   ))}
//                 </div>
//               </div>
//             </section>
//           </div>
//         </aside>

//         <section className="border-r border-white/15 px-4 py-5 lg:px-6 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//           <div className="grid h-[calc(100vh-72px)] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
//             {items.map((item) => (
//               <article
//                 key={item.title}
//                 className="group rounded-xl border border-white/15 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/35 hover:bg-white/[0.06]"
//               >
//                 <div className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-white/5">
//                   <Image
//                     src="/placeholder.svg"
//                     alt="Article preview"
//                     width={640}
//                     height={360}
//                     className="h-36 w-full object-cover"
//                   />
//                 </div>

//                 <div className="mb-2 text-[11px] uppercase tracking-wide text-white/50">
//                   {item.authors.map((a) => a.name).join(" • ")} | {item.year}
//                 </div>

//                 <h2 className="text-base font-extrabold leading-tight text-white">
//                   {item.title}
//                 </h2>

//                 {/* put abstract here */}
//                 <p className="mt-2 line-clamp-3 text-sm leading-5 text-white/70"> 
//                   {item.abstract}
//                 </p>

//                 <div className="mt-3 flex flex-wrap gap-2">
//                   {item.research_area.map((tag) => (
//                     <span
//                       key={tag}
//                       className="rounded-full border border-[#1da0c9]/50 bg-[#1da0c9]/10 px-2 py-0.5 text-[11px] font-medium text-[#9ddff2]"
//                     >
//                       {tag}
//                     </span>
//                   ))}
//                 </div>
//               </article>
//             ))}
//           </div>
//         </section>

//         <FaqRail />
//       </div>
//     </main>
//   );
// }


/*

FAQ section
<aside className="px-4 py-5 lg:px-6">
  <div className="rounded-lg border border-white/30 p-4">
    <h3 className="mb-4 text-sm font-semibold">Frequently Asked Questions (FAQ)</h3>
    <div className="space-y-3 text-sm text-white/75">
      {[
        "When is thesis?",
        "When is capstone?",
        "Who are the advisors?",
        "How do I submit my paper?",
        "Can I contribute?",
        "How do I contribute?",
        "Are these verified?",
        "Can we use these as citations?",
      ].map((q) => (
        <button key={q} className="flex w-full items-center justify-between border-b border-white/10 pb-2 text-left">
          <span>{q}</span>
          <span>⌄</span>
        </button>
      ))}
    </div>
  </div>
</aside>

research_area
<div>
  <div className="mb-2 font-semibold">research_area</div>
  <select className="w-full rounded border border-white/25 bg-transparent px-2 py-1 outline-none">
    <option>Add Tag</option>
  </select>
</div>

abstract
<p className="mt-2 line-clamp-3 text-sm leading-5 text-white/70"> 
  {item.abstract}
</p>


      <main className="mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16">
        <h1 className="text-3xl font-bold mb-8">Repository</h1>

        <div className="flex flex-col gap-6">
          <div className="rounded-lg border border-[#d9d9d9]/15 p-6 transition-colors hover:bg-white/5">
            <div className="mb-2 text-sm text-[#969696]">2026 • Computer Science</div>
            <h2 className="mb-3 text-xl font-extrabold leading-tight">
              An Analysis of Distributed Systems in Micro-Frontend Architectures
            </h2>
            <p className="text-sm text-[#d8dadc] line-clamp-3">
              This paper explores the intricacies of implementing distributed systems concepts within the context of micro-frontend architectures, focusing on performance, state synchronization, and fault tolerance across decoupled UI domains.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-[#1da0c9]/10 px-3 py-1 text-xs font-medium text-[#1da0c9]">Architecture</span>
              <span className="rounded-full bg-[#1da0c9]/10 px-3 py-1 text-xs font-medium text-[#1da0c9]">Frontend</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#d9d9d9]/15 p-6 transition-colors hover:bg-white/5">
            <div className="mb-2 text-sm text-[#969696]">2025 • Information Technology</div>
            <h2 className="mb-3 text-xl font-extrabold leading-tight">
              Evaluating Machine Learning Models for Early Bug Detection
            </h2>
            <p className="text-sm text-[#d8dadc] line-clamp-3">
              A comprehensive study on utilizing various machine learning approaches to identify potential software defects during the early stages of the development lifecycle, significantly reducing QA turnaround times.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="rounded-full bg-[#1da0c9]/10 px-3 py-1 text-xs font-medium text-[#1da0c9]">Machine Learning</span>
              <span className="rounded-full bg-[#1da0c9]/10 px-3 py-1 text-xs font-medium text-[#1da0c9]">QA</span>
            </div>
          </div>
        </div>
      </main>



      <section className="border-r border-white/15 px-4 py-5 lg:px-6">
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.title} className="border-b border-white/10 pb-4">
              <div className="text-xs text-white/50">{item.authors}</div>
              <h2 className="mt-1 text-xl font-black leading-tight">{item.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.research_area.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/25 px-2 py-0.5 text-[11px] text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

*/