import Link from "next/link";

export function AuthTabs({ active }: { active: "login" | "sign-up" }) {
  return (
    <nav
      aria-label="Authentication"
      className="grid h-[57px] grid-cols-2 rounded-[20px] border border-[#368bfe] p-1"
    >
      <Link
        href="/login"
        aria-current={active === "login" ? "page" : undefined}
        className={`grid place-items-center rounded-[18px] font-[var(--font-display)] text-xl font-semibold ${
          active === "login"
            ? "bg-[#368bfe] text-white"
            : "text-[var(--color-text)]"
        }`}
      >
        Log In
      </Link>
      <Link
        href="/sign-up"
        aria-current={active === "sign-up" ? "page" : undefined}
        className={`grid place-items-center rounded-[18px] font-[var(--font-display)] text-xl font-semibold ${
          active === "sign-up"
            ? "bg-[#368bfe] text-white"
            : "text-[var(--color-text)]"
        }`}
      >
        Sign Up
      </Link>
    </nav>
  );
}
