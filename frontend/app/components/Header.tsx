import Image from "next/image";

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


export default function Header() {
    return (
        <header className="flex items-center gap-6 border-b border-white/15 px-4 py-4 lg:px-6">
            <div className="flex shrink-0 items-center gap-3">
            <Image src="/logo.svg" alt="Alexandria" width={28} height={28} />
            <span className="text-lg font-black tracking-tight text-[#2f78ff]">
                ALEXANDRIA
            </span>
            </div>

            <div className="flex flex-1 justify-center">
            <div className="flex w-full max-w-[520px] items-center gap-3 rounded-full border border-[#2f78ff] bg-white px-4 py-2 text-[#14181c] shadow-[0_0_0_1px_rgba(47,120,255,0.35)]">
                <input
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                placeholder="Find the Thesis, Research, or Capstone you need"
                />
                <button className="text-zinc-700">⌕</button>
            </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
            <button className="h-8 w-14 rounded-full border border-white/25" />
            <button className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25">
                ☼
            </button>
            <a
                href="https://github.com"
                className="flex h-8 w-8 items-center justify-center text-sm"
                aria-label="GitHub"
            >
                <Image
                    src="/githublogo.svg"
                    alt="Github Logo"
                    width={800}
                    height={500}
                />
            </a>
            </div>
        </header>
    )
}