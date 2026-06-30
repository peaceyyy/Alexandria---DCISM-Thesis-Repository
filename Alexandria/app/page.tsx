// frontend/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#14181c] text-white">
      <header className="relative z-10 flex items-center justify-between px-6 pt-8 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center">
            <Image src="/logo.svg"
                   alt="Alexandra Logo"
                   width={800}
                   height={450}
            />
            {/* <span className="text-lg font-black">A</span> */}
          </div>
          <span className="text-xl font-black tracking-tight">ALEXANDRIA</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-14 items-center justify-between rounded-full border border-white/30 px-2 text-white/80"
            aria-label="Toggle theme"
          >
            <span className="text-xs">☼</span>
            <span className="text-xs">◔</span>
          </button>
          <a
            href="https://github.com"
            className="flex h-10 w-10 items-center justify-center text-sm"
            aria-label="GitHub"
          >
            <Image src="/githublogo.svg"
                   alt="Github Logo"
                   width={800}
                   height={500}
            />
          </a>
        </div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-96px)] max-w-7xl flex-col px-6 pb-28 pt-16 sm:px-10 lg:px-16">
        <div className="max-w-4xl">
          <div className="flex flex-nowrap items-end gap-x-4 gap-y-2">
            <h1
              className="shrink-0 whitespace-nowrap font-[var(--font-khula)] text-[clamp(4rem,8vw,7.5rem)] font-extrabold leading-none tracking-[-0.06em] bg-[conic-gradient(from_180deg_at_50%_50%,#368bfe_0deg,#1752f0_180deg,#368bfe_360deg)] bg-clip-text text-transparent"
            >
              ALEXANDRIA
            </h1>
            <span className="pb-3 text-sm font-medium text-[#ffd900] sm:text-base whitespace-nowrap">
              (al-ig-ZAN-dree-uh)
            </span>
          </div>

          <h2 className="max-w-none whitespace-nowrap text-[clamp(2.25rem,4vw,3.45rem)] font-black leading-[0.95] tracking-[-0.04em] text-white">
            Thesis, Research, and Capstone Hub
          </h2>

          <p className="mt-6 text-xl font-semibold text-[#969696] sm:text-[28px]">
            by DCISM Students, for DCISM Students
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#368bfe] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2f78ff]"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#368bfe] bg-transparent px-8 text-base font-semibold text-white transition-colors hover:bg-white/5"
            >
              Sign Up
            </Link>
          </div>

          <p className="mt-4 text-sm font-semibold text-white">
            Want to contribute your thesis/research paper?{" "}
            <a href="#" className="underline underline-offset-2">
              Submit here
            </a>
          </p>
        </div>
      </section>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32vh]">
        <Image
          src="/landing-waves.svg"
          alt=""
          fill
          priority
          className="object-cover object-bottom"
        />
      </div>
    </main>
  );
}

// return (
//   <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
//     <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
//       <Image
//         className="dark:invert"
//         src="/next.svg"
//         alt="Next.js logo"
//         width={100}
//         height={20}
//         priority
//       />
//       <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
//         <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
//           To get started, edit the page.tsx file.
//         </h1>
//         <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
//           Looking for a starting point or more instructions? Head over to{" "}
//           <a
//             href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             className="font-medium text-zinc-950 dark:text-zinc-50"
//           >
//             Templates
//           </a>{" "}
//           or the{" "}
//           <a
//             href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             className="font-medium text-zinc-950 dark:text-zinc-50"
//           >
//             Learning
//           </a>{" "}
//           center.
//         </p>
//       </div>
//       <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
//         <a
//           className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
//           href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             className="dark:invert"
//             src="/vercel.svg"
//             alt="Vercel logomark"
//             width={16}
//             height={16}
//           />
//           Deploy Now
//         </a>
//         <a
//           className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
//           href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Documentation
//         </a>
//       </div>
//     </main>
//   </div>
// );