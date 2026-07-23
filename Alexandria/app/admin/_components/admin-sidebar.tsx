"use client";

import {
  Book,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  X,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-sidebar.module.css";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AlexandriaBrandLockup } from "@/components/ui/alexandria-brand-lockup";
import { logoutAction } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/auth-contract";
import { getRoleDisplay } from "@/lib/auth/role-display";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
};

const NAV_LINKS: NavLink[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "moderator"],
  },
  {
    href: "/admin/users",
    label: "User Management",
    icon: Users,
    roles: ["admin"],
  },
];

export function AdminSidebar({
  role,
  email,
  profileName,
  isCollapsed,
  isMobileOpen,
  isNarrowViewport,
  onToggleCollapse,
  onMobileClose,
  onNavigate,
}: {
  role: UserRole;
  email: string;
  profileName: string;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isNarrowViewport: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const display = getRoleDisplay(role);

  return (
    <aside
      id="admin-sidebar"
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${
        isMobileOpen ? styles.mobileOpen : ""
      }`}
      aria-label="Admin navigation"
      aria-hidden={isNarrowViewport && !isMobileOpen ? true : undefined}
    >
      {/* Brand */}
      <Link
        href="/admin/dashboard"
        className={styles.brand}
        aria-label="Alexandria Admin Home"
        onClick={onNavigate}
      >
        <AlexandriaBrandLockup
          markSize={36}
          wordmarkClassName={styles.brandText}
          priority
        />
      </Link>

      <button
        type="button"
        className={styles.collapseButton}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!isCollapsed}
        aria-controls="admin-sidebar"
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        onClick={onToggleCollapse}
      >
        {isCollapsed ? (
          <PanelLeftOpen size={17} aria-hidden />
        ) : (
          <PanelLeftClose size={17} aria-hidden />
        )}
      </button>

      <button
        type="button"
        className={styles.mobileCloseButton}
        aria-label="Close navigation menu"
        title="Close navigation menu"
        onClick={onMobileClose}
      >
        <X size={18} aria-hidden />
      </button>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Admin navigation">
        <ul role="list" className={styles.navList}>
          {NAV_LINKS.filter((link) => link.roles.includes(role)).map(
            ({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                    aria-current={isActive ? "page" : undefined}
                    title={isCollapsed ? label : undefined}
                    onClick={onNavigate}
                  >
                    <Icon size={18} aria-hidden className={styles.navIcon} />
                    <span className={styles.navText}>{label}</span>
                  </Link>
                </li>
              );
            },
          )}
        </ul>
      </nav>

      {/* ── Footer: contribute + utility strip + account identity ── */}
      <div className={styles.footer}>
        <div className={styles.footerActions}>
          {/* Row 1: Contribute — full width */}
          <Link
            href="/upload"
            className={styles.contributeStrip}
            aria-label="Contribute a thesis"
            title="Contribute"
            onClick={onNavigate}
          >
            <Upload size={16} aria-hidden />
            <span>Contribute</span>
          </Link>

          {/* Row 2: Theme toggle + Browse nav */}
          <div className={styles.utilityRow}>
            <ThemeToggle presentation="strip" />
            <Link
              href="/home"
              className={styles.utilityTile}
              aria-label="Browse repository"
              title="Browse repository"
              onClick={onNavigate}
            >
              <Book size={16} aria-hidden />
            </Link>
          </div>
        </div>

        <div className={cn(styles.accountPill, display.className)}>
          <Link
            href="/profile"
            className={styles.profileLink}
            aria-label="Open your profile"
            title="Open profile"
            onClick={onNavigate}
          >
            <span className={styles.profileInitial} aria-hidden>
              {display.abbreviation}
            </span>
            <span className={styles.profileDetails}>
              <span className={styles.profileName}>{profileName}</span>
            </span>
          </Link>
          <form action={logoutAction} className={styles.logoutForm}>
            <button
              type="submit"
              className={styles.logoutBtn}
              aria-label="Log out"
              title="Log Out"
            >
              <LogOut size={16} aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
