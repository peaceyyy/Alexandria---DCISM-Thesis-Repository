"use client";

import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Users,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./admin-sidebar.module.css";

import { logoutAction } from "@/lib/auth/actions";
import type { UserRole } from "@/lib/auth/auth-contract";

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
  isCollapsed,
  isMobileOpen,
  isNarrowViewport,
  onToggleCollapse,
  onMobileClose,
  onNavigate,
}: {
  role: UserRole;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  isNarrowViewport: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

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
        <Image
          src="/brand/alexandria-mark.svg"
          width={36}
          height={36}
          alt=""
          className="theme-invert"
          priority
        />
        <span className={styles.brandText}>ALEXANDRIA</span>
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

      {/* Browse Repository — lets admins/mods see the public site */}
      <div className={styles.viewSite}>
        <Link
          href="/home"
          className={styles.viewSiteLink}
          aria-label="Browse the public thesis repository"
          title={isCollapsed ? "Browse Repository" : undefined}
          onClick={onNavigate}
        >
          <ExternalLink size={14} aria-hidden />
          <span className={styles.viewSiteText}>Browse Repository</span>
        </Link>
      </div>

      {/* Logout */}
      <div className={styles.footer}>
        <form action={logoutAction}>
          <button
            type="submit"
            className={styles.logoutBtn}
            aria-label="Log out"
            title={isCollapsed ? "Log Out" : undefined}
          >
            <LogOut size={16} aria-hidden />
            <span className={styles.logoutText}>Log Out</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
