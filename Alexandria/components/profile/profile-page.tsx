import Image from "next/image";
import Link from "next/link";
import { RoleIndicator } from "@/components/auth/role-indicator";
import { logoutAction } from "@/lib/auth/actions";
import {
  formatMemberSince,
  getAccessLevels,
  getAffiliationLabel,
} from "@/lib/auth/profile-display";
import { getRoleDisplay } from "@/lib/auth/role-display";
import type { CurrentUser } from "@/lib/services/types";

export function ProfilePage({
  user,
  logoutError = false,
}: {
  user: CurrentUser;
  logoutError?: boolean;
}) {
  const role = getRoleDisplay(user.role);
  const accessLevels = getAccessLevels(user.role);
  const initial = user.profile_name.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-[#14181c] text-white">
      <header className="border-b border-white/15 bg-[#0f1317]">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-5 px-5 sm:px-8">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 text-sm font-black tracking-[0.08em] text-[#368bfe]"
          >
            <Image
              src="/logo.svg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span>ALEXANDRIA</span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <form
              action="/theses"
              className="hidden h-9 w-[300px] max-w-[36vw] items-center rounded-md border border-white/20 bg-[#0b0f13] px-3 focus-within:border-[#368bfe] sm:flex"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4 shrink-0 text-[#969696]"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <label htmlFor="profile-header-search" className="sr-only">
                Search the repository
              </label>
              <input
                id="profile-header-search"
                name="q"
                type="search"
                placeholder="Search Alexandria"
                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder:text-[#7e858c]"
              />
              <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-[#969696]">
                /
              </kbd>
            </form>

            <RoleIndicator role={user.role} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl items-center px-5 py-12 sm:px-8 lg:py-16">
        <section
          aria-labelledby="profile-heading"
          className="w-full rounded-[7px] border border-white/20 bg-[#171c21] shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7e858c]">
                Account
              </p>
              <h1 id="profile-heading" className="mt-1 text-xl font-semibold">
                Profile
              </h1>
            </div>
            <Link
              href="/theses"
              className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-[#b9bec3] transition-colors hover:bg-white/5 hover:text-white"
            >
              Back to Home
            </Link>
          </div>

          {logoutError ? (
            <div
              role="alert"
              className="mx-6 mt-6 rounded-md border border-[#ff6b6b]/35 bg-[#ff6b6b]/10 px-4 py-3 text-sm text-[#ff9a9a] sm:mx-8"
            >
              We could not log you out. Please try again.
            </div>
          ) : null}

          <div className="grid gap-10 p-6 sm:p-8 md:grid-cols-[220px_minmax(0,1fr)] md:items-center lg:gap-14 lg:p-12">
            <div className="mx-auto flex flex-col items-center">
              <div className="grid h-44 w-44 place-items-center rounded-full border border-white/30 bg-[#0f1317] shadow-[inset_0_0_0_8px_rgba(255,255,255,0.02)] sm:h-48 sm:w-48">
                <span
                  aria-hidden="true"
                  className="text-6xl font-light tracking-[-0.06em] text-white"
                >
                  {initial}
                </span>
              </div>
              <span
                className={`mt-5 inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-bold uppercase tracking-[0.12em] ${role.className}`}
              >
                {role.label}
              </span>
            </div>

            <div className="min-w-0">
              <div className="border-b border-white/10 pb-6">
                <p className="text-sm text-[#7e858c]">Signed in as</p>
                <h2 className="mt-1 truncate text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                  {user.profile_name}
                </h2>
              </div>

              <dl className="grid gap-x-8 gap-y-4 border-b border-white/10 py-6 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
                <dt className="text-[#969696]">Email</dt>
                <dd className="break-all text-[#e4e6e8] sm:text-right">
                  {user.email}
                </dd>

                <dt className="text-[#969696]">Affiliation</dt>
                <dd className="text-[#e4e6e8] sm:text-right">
                  {getAffiliationLabel(user.affiliation)}
                </dd>

                <dt className="text-[#969696]">Member since</dt>
                <dd className="text-[#e4e6e8] sm:text-right">
                  {formatMemberSince(user.created_at)}
                </dd>

                <dt className="text-[#969696]">Access</dt>
                <dd className="flex flex-wrap gap-2 sm:justify-end">
                  {accessLevels.map((level) => (
                    <span
                      key={level}
                      className="rounded-md border border-white/15 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-[#d8dadc]"
                    >
                      {level}
                    </span>
                  ))}
                </dd>
              </dl>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled
                  title="Password changes are not available yet"
                  className="inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-md border border-white/15 bg-white/[0.03] px-6 text-sm font-semibold text-[#7e858c]"
                >
                  Change Password
                </button>

                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#d73a3a] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#e64646] sm:w-auto"
                  >
                    Log Out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
