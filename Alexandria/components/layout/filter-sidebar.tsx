"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ACADEMIC_UNITS,
  type AcademicUnitId,
  type Department,
} from "@/lib/domain/departments";
import { RESEARCH_AREAS } from "@/lib/domain/research-areas";
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type { UserRole } from "@/lib/auth/auth-contract";
import { getPostAuthDestination } from "@/lib/auth/auth-routing";
import { getRoleDisplay } from "@/lib/auth/role-display";
import { logoutAction } from "@/lib/auth/actions";
import { AuthInterceptModal } from "@/app/(auth)/_components/auth-intercept-modal";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AlexandriaBrandLockup } from "@/components/ui/alexandria-brand-lockup";
import styles from "./filter-sidebar.module.css";

type FilterSidebarProps = {
  className?: string;
  fromYear: string;
  toYear: string;
  setFromYear: (value: string) => void;
  setToYear: (value: string) => void;
  selectedResearchAreas: string[];
  selectedDepartments: string[];
  selectedStudyTypes: string[];
  onToggleResearchArea: (value: string) => void;
  onToggleDepartment: (value: string) => void;
  onToggleStudyType: (value: string) => void;
  showMySubmissions: boolean;
  mySubmissionsActive: boolean;
  flaggedSubmissionCount: number;
  onToggleMySubmissions: () => void;
  role?: UserRole | null;
  profileName?: string | null;
  query?: string;
  /** Only relevant on xl+ screens; ignored inside the mobile Dialog drawer */
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

const PROGRAM_LABELS: Record<Department, string> = {
  CS: "Computer Science",
  IT: "Information Technology",
  IS: "Information Systems",
};

const chipClass = (selected: boolean, accent = "brand") =>
  cn(
    styles.filterChip,
    selected &&
      (accent === "cyan"
        ? styles.filterChipCyanSelected
        : styles.filterChipSelected),
  );

export default function FilterSidebar({
  className,
  fromYear,
  toYear,
  setFromYear,
  setToYear,
  selectedResearchAreas,
  selectedDepartments,
  selectedStudyTypes,
  onToggleResearchArea,
  onToggleDepartment,
  onToggleStudyType,
  showMySubmissions,
  mySubmissionsActive,
  flaggedSubmissionCount,
  onToggleMySubmissions,
  role = null,
  profileName = null,
  query = "",
  isCollapsed = false,
  onToggleCollapse,
}: FilterSidebarProps) {
  const [researchAreasOpen, setResearchAreasOpen] = useState(false);
  const [academicUnitId, setAcademicUnitId] = useState<AcademicUnitId>("dcism");
  const display = getRoleDisplay(role);
  const isPrivileged = role === "admin" || role === "moderator";
  const accountName = profileName?.trim() || display.label;
  const academicUnit =
    ACADEMIC_UNITS.find((unit) => unit.id === academicUnitId) ??
    ACADEMIC_UNITS[0];
  const academicUnitLocked = ACADEMIC_UNITS.length === 1;

  const handleAcademicUnitChange = (nextUnitId: AcademicUnitId) => {
    const nextUnit = ACADEMIC_UNITS.find((unit) => unit.id === nextUnitId);
    if (!nextUnit) return;

    setAcademicUnitId(nextUnitId);
    selectedDepartments
      .filter((program) => !nextUnit.programs.includes(program as Department))
      .forEach(onToggleDepartment);
  };

  return (
    <aside
      id="filter-sidebar"
      className={cn(
        styles.sidebar,
        isCollapsed && styles.collapsed,
        "flex h-full flex-col px-3 py-4",
        className,
      )}
      aria-label="Repository navigation and filters"
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
            aria-controls="filter-sidebar"
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
        {mySubmissionsActive && <input type="hidden" name="mine" value="1" />}
        <label className={styles.searchLabel}>
          <span className="sr-only">Search Alexandria</span>
          <Search size={15} aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search research…"
          />
        </label>
      </form>

      <nav className={styles.workspaceNav} aria-label="Repository workspace">
        {showMySubmissions && (
          <button
            type="button"
            className={cn(
              styles.workspaceAction,
              mySubmissionsActive && styles.workspaceActionActive,
            )}
            onClick={onToggleMySubmissions}
            aria-pressed={mySubmissionsActive}
            aria-label="My submissions"
            title="My submissions"
          >
            <FileText size={15} aria-hidden />
            <span className={styles.workspaceLabel}>My submissions</span>
            {flaggedSubmissionCount > 0 && (
              <span className={styles.revisionBadge}>
                {flaggedSubmissionCount}
              </span>
            )}
          </button>
        )}
      </nav>

      <div className={styles.body} aria-hidden={isCollapsed ? true : undefined}>
        <p className={styles.browseLabel}>Filters</p>
        <section className={styles.filterSections}>
          <div>
            <div className={styles.filterHeading}>Study type</div>
            <div className="flex flex-wrap gap-2">
              {[
                ["thesis", "Thesis"],
                ["capstone", "Capstone"],
              ].map(([value, label]) => {
                const isSelected = selectedStudyTypes.includes(value);
                return (
                  <label key={value} className={chipClass(isSelected)}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => onToggleStudyType(value)}
                      tabIndex={isCollapsed ? -1 : undefined}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className={styles.filterHeading} htmlFor="academic-unit">
              Department
            </label>
            <select
              id="academic-unit"
              value={academicUnit.id}
              disabled={academicUnitLocked}
              onChange={(event) =>
                handleAcademicUnitChange(event.target.value as AcademicUnitId)
              }
              className={styles.academicUnitSelect}
              aria-describedby="academic-unit-help"
              tabIndex={isCollapsed ? -1 : undefined}
            >
              {ACADEMIC_UNITS.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.label}
                </option>
              ))}
            </select>
            <p id="academic-unit-help" className={styles.contextNote}>
              {academicUnitLocked
                ? "This MVP only covers the DCISM department for now."
                : "You can filter by department and sub-department"}
            </p>
          </div>

          <div>
            <div className={styles.filterHeading}>Program</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {academicUnit.programs.map((department) => {
                const isSelected = selectedDepartments.includes(department);
                return (
                  <label key={department} className={chipClass(isSelected)}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => onToggleDepartment(department)}
                      tabIndex={isCollapsed ? -1 : undefined}
                    />
                    {PROGRAM_LABELS[department]}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <div className={styles.filterHeading}>Year</div>
            <div className="flex gap-2">
              <input
                value={fromYear}
                onChange={(event) => setFromYear(event.target.value)}
                className={styles.yearInput}
                placeholder="From"
                inputMode="numeric"
                tabIndex={isCollapsed ? -1 : undefined}
              />
              <input
                value={toYear}
                onChange={(event) => setToYear(event.target.value)}
                className={styles.yearInput}
                placeholder="To"
                inputMode="numeric"
                tabIndex={isCollapsed ? -1 : undefined}
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              className={styles.disclosure}
              onClick={() => setResearchAreasOpen((open) => !open)}
              aria-expanded={researchAreasOpen}
              tabIndex={isCollapsed ? -1 : undefined}
            >
              <span>
                Research area
                {selectedResearchAreas.length > 0 &&
                  ` (${selectedResearchAreas.length})`}
              </span>
              <ChevronDown
                size={14}
                aria-hidden
                className={cn(researchAreasOpen && "rotate-180")}
              />
            </button>
            {researchAreasOpen && (
              <div className="mt-3 flex flex-wrap gap-2">
                {RESEARCH_AREAS.map((area) => {
                  const isSelected = selectedResearchAreas.includes(area.id);
                  return (
                    <label
                      key={area.id}
                      className={chipClass(isSelected, "cyan")}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => onToggleResearchArea(area.id)}
                        tabIndex={isCollapsed ? -1 : undefined}
                      />
                      {area.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className={styles.accountArea}>
        {isPrivileged ? (
          <div className={styles.staffFooterActions}>
            {/* Row 1: Contribute — full width */}
            <Link
              href="/upload"
              className={styles.contributeStrip}
              aria-label="Contribute a thesis"
              title="Contribute"
            >
              <Upload size={16} aria-hidden />
              <span>Contribute</span>
            </Link>
            {/* Row 2: Theme toggle + Dashboard nav */}
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
              onDragStart={(event) => event.preventDefault()}
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
            onDragStart={(event) => event.preventDefault()}
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
