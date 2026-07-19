"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminSidebar } from "@/app/admin/_components/admin-sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import type { UserRole } from "@/lib/auth/auth-contract";

export function AdminLayoutWrapper({
  children,
  role,
  email,
  profileName,
}: {
  children: React.ReactNode;
  role: UserRole;
  email: string;
  profileName: string;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateViewport = () => setIsNarrowViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    if (!isNarrowViewport) {
      setIsMobileOpen(false);
    }
  }, [isNarrowViewport]);

  useEffect(() => {
    if (!isMobileOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMobileOpen]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  function closeMobileNavigation() {
    setIsMobileOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  }

  // Hide sidebar on the review detail page to maximize screen real estate for the focus mode
  const isReviewDetail =
    pathname.startsWith("/admin/review/") && pathname !== "/admin/review";

  if (isReviewDetail) {
    return (
      <div className="flex min-h-svh bg-[var(--color-bg)] relative">
        <div className="fixed right-4 top-4 z-40">
          <ThemeToggle />
        </div>
        <main className="flex-1 min-h-svh flex flex-col" id="admin-main-content">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh bg-[var(--color-bg)] relative">
      <a
        href="#admin-main-content"
        className="sr-only fixed left-4 top-4 z-[60] rounded-[6px] bg-[var(--color-brand)] px-3 py-2 text-sm font-semibold text-white focus:not-sr-only focus:outline-none focus:ring-2 focus:ring-white"
      >
        Skip to content
      </a>
      <AdminSidebar
        role={role}
        email={email}
        profileName={profileName}
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        isNarrowViewport={isNarrowViewport}
        onToggleCollapse={() => setIsCollapsed((collapsed) => !collapsed)}
        onMobileClose={closeMobileNavigation}
        onNavigate={() => setIsMobileOpen(false)}
      />
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[var(--color-bg)]/80 lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeMobileNavigation}
        />
      )}
      <main
        className={`min-w-0 flex-1 min-h-svh flex flex-col transition-[margin] duration-200 motion-reduce:transition-none ${
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-[240px]"
        }`}
        id="admin-main-content"
        tabIndex={-1}
      >
        <div className="h-14 shrink-0 lg:hidden" aria-hidden="true" />
        <button
          ref={menuButtonRef}
          type="button"
          className="fixed left-3 top-3 z-30 inline-flex size-9 items-center justify-center rounded-[6px] border border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-text)] shadow-lg transition hover:border-[var(--color-separator-mid)] hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] lg:hidden"
          aria-label="Open navigation menu"
          aria-expanded={isMobileOpen}
          aria-controls="admin-sidebar"
          title="Open navigation menu"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu size={18} aria-hidden />
        </button>
        {children}
      </main>
    </div>
  );
}
