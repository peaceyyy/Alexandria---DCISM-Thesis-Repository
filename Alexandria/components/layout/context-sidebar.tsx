"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Search, FileText, Upload } from "lucide-react";
import type { UserRole } from "@/lib/auth/auth-contract";
import { getPostAuthDestination } from "@/lib/auth/auth-routing";
import { logoutAction } from "@/lib/auth/actions";
import { getRoleDisplay } from "@/lib/auth/role-display";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AlexandriaBrandLockup } from "@/components/ui/alexandria-brand-lockup";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import styles from "./filter-sidebar.module.css";
import { AuthInterceptModal } from "@/app/(auth)/_components/auth-intercept-modal";

type ContextSidebarProps = {
  role: UserRole | null;
  profileName?: string | null;
  active: "detail" | "profile";
  returnHref?: string;
  returnLabel?: string;
};

function SidebarContent({
  role,
  profileName,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: ContextSidebarProps & {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}) {
  const display = getRoleDisplay(role);
  const isStaff = role === "admin" || role === "moderator";
  const accountName = profileName?.trim() || display.label;

  return (
    <aside
      className={cn(
        styles.sidebar,
        isCollapsed && styles.collapsed,
        "flex h-full flex-col px-3 py-4",
        className
      )}
      aria-label="Context navigation"
    >
      <div className={styles.brandRow}>
        {!isCollapsed && (
          <Link
            href="/home"
            className={styles.brand}
            aria-label="Alexandria repository home"
          >
            <AlexandriaBrandLockup wordmarkClassName={styles.brandName} />
          </Link>
        )}
        {onToggleCollapse && (
          <button
            type="button"
            className={styles.collapseButton}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapse}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={14} aria-hidden />
            ) : (
              <PanelLeftClose size={14} aria-hidden />
            )}
          </button>
        )}
      </div>

      <form action="/home" method="get" className={styles.searchForm}>
        <label className={styles.searchLabel}>
          <span className="sr-only">Search Alexandria</span>
          <Search size={15} aria-hidden />
          <input
            type="search"
            name="q"
            placeholder="Search research…"
          />
        </label>
      </form>

      <nav className={styles.workspaceNav} aria-label="Context workspace">
        <Link
          href="/home?mine=1"
          className={styles.workspaceAction}
          aria-label="My submissions"
          title="My submissions"
        >
          <FileText size={15} aria-hidden />
          <span className={styles.workspaceLabel}>My submissions</span>
        </Link>
      </nav>

      <div className={styles.body} aria-hidden={isCollapsed ? true : undefined}>
        {/* Intentionally left blank. The ContextSidebar mirrors FilterSidebar but removes the filters. */}
      </div>

      <footer className={styles.accountArea}>
        {isStaff ? (
          <div className={styles.staffFooterActions}>
            <Link
              href="/upload"
              className={styles.contributeStrip}
              aria-label="Contribute a thesis"
              title="Contribute"
            >
              <Upload size={16} aria-hidden />
              <span>Contribute</span>
            </Link>
            <div className={styles.utilityRow}>
              <ThemeToggle presentation="strip" />
              <Link
                href={getPostAuthDestination(role ?? undefined)}
                className={styles.utilityTile}
                aria-label="Open dashboard"
                title="Dashboard"
              >
                <LayoutDashboard size={16} aria-hidden />
              </Link>
            </div>
          </div>
        ) : (
          <div className={styles.accountActions}>
            <ThemeToggle />
            {!role ? (
              <AuthInterceptModal
                iconOnly={isCollapsed}
                triggerClassName={styles.contributeButton}
              />
            ) : (
              <Link
                href="/upload"
                className={
                  isCollapsed
                    ? styles.contributeLinkIcon
                    : styles.contributeButton
                }
                aria-label="Contribute a thesis"
                title="Contribute"
              >
                <Upload size={14} aria-hidden />
                {!isCollapsed && <span>Contribute</span>}
              </Link>
            )}
          </div>
        )}

        {role ? (
          <div className={cn(styles.accountPill, display.className)}>
            <Link
              href="/profile"
              draggable={false}
              className={styles.accountLink}
              aria-label={`Open profile for ${accountName}`}
              title={accountName}
            >
              <span className={styles.roleMarker} aria-hidden>
                {display.abbreviation}
              </span>
              <span className={styles.accountName}>{accountName}</span>
            </Link>
            <form action={logoutAction} className={styles.logoutForm}>
              <button
                type="submit"
                className={styles.logoutBtn}
                aria-label="Log out"
                title="Log Out"
              >
                <LogOut size={14} aria-hidden />
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            draggable={false}
            className={cn(styles.accountPill, styles.accountLink, display.className)}
            aria-label="Sign in"
            title="Sign In"
          >
            <span className={styles.roleMarker} aria-hidden>
              {display.abbreviation}
            </span>
            <span className={styles.accountName}>{accountName}</span>
          </Link>
        )}
      </footer>
    </aside>
  );
}

export function ContextSidebar(props: ContextSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("alex:filter-sidebar-collapsed");
    if (stored === "1") setIsCollapsed(true);
  }, []);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("alex:filter-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  return (
    <>
      {/* Desktop sidebar */}
      <SidebarContent
        {...props}
        className="hidden xl:flex xl:flex-col"
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      {/* Mobile workspace drawer */}
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent
          className="!left-0 !top-0 h-dvh w-[min(22rem,calc(100%-2rem))] !max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-y-auto rounded-none border-r border-[var(--color-separator)] bg-[var(--color-bg)] p-0 text-[var(--color-text)]"
        >
          <SidebarContent {...props} className="border-0 px-5 pt-3 pb-5" />
        </DialogContent>
      </Dialog>

      {/* Floating workspace tab for mobile */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="fixed left-0 top-4 z-30 xl:hidden inline-flex h-8 w-8 items-center justify-center rounded-r-md border border-l-0 border-[var(--color-separator-mid)] bg-[var(--color-surface)] text-[var(--color-text-muted)] transition-colors duration-150 hover:border-[var(--color-brand-bright)]/30 hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bright)]/30"
        aria-label="Open navigation"
        title="Open navigation"
      >
        <PanelLeftOpen size={14} aria-hidden />
      </button>
    </>
  );
}
