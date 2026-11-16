"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

// SVG Icon Helpers from Flowmetrics UI Kit
function Icon({ name }: { name: string }) {
  switch (name) {
    case "grid":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "list":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "users":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.6-3.5 3.2-5 6.5-5s5.9 1.5 6.5 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c2 .5 3 2 3.5 5" />
        </svg>
      );
    case "tick":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
        </svg>
      );
    case "book":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5" />
        </svg>
      );
    case "bot":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="8" width="16" height="11" rx="3" />
          <path d="M12 8V4M9 13h.01M15 13h.01" />
        </svg>
      );
    case "flow":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8.5 6H14a3 3 0 0 1 3 3v6.5" />
        </svg>
      );
    case "chart":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    case "shield":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
        </svg>
      );
    case "card":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "pen":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20l1-4L17 4l3 3L8 19zM14 7l3 3" />
        </svg>
      );
    case "sparkle":
      return (
        <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 6.8L21 11.2l-6.6 2.4L12 20.4l-2.4-6.8L3 11.2l6.6-2.4z" />
        </svg>
      );
    default:
      return null;
  }
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [{ href: "/admin", label: "Overview", icon: "grid" }],
  },
  {
    title: "Work Management",
    items: [
      { href: "/admin/projects", label: "Projects", icon: "grid" },
      { href: "/admin/tasks", label: "Tasks", icon: "list" },
      { href: "/admin/sprints", label: "Sprints", icon: "flow" },
      { href: "/admin/workload", label: "Workload", icon: "users" },
      { href: "/admin/teams", label: "Teams", icon: "users" },
    ],
  },
  {
    title: "Support Operations",
    items: [
      { href: "/admin/support", label: "Tickets", icon: "tick" },
      { href: "/admin/support/queues", label: "Queues", icon: "list" },
      { href: "/admin/support/sla", label: "SLA", icon: "shield" },
      { href: "/admin/knowledge", label: "Knowledge Base", icon: "book" },
    ],
  },
  {
    title: "AI Platform",
    items: [
      { href: "/admin/agents", label: "Agents", icon: "bot" },
      { href: "/admin/agent-runs", label: "Agent Runs", icon: "chart" },
      { href: "/admin/approvals", label: "Approvals", icon: "tick" },
      { href: "/admin/evaluations", label: "Evaluations", icon: "sparkle" },
      { href: "/admin/observability", label: "Observability", icon: "chart" },
      { href: "/admin/workflows", label: "Workflows", icon: "flow" },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/admin/members", label: "Members", icon: "users" },
      { href: "/admin/roles", label: "Roles", icon: "shield" },
      { href: "/admin/audit", label: "Audit Logs", icon: "shield" },
      { href: "/admin/settings", label: "Settings", icon: "shield" },
      { href: "/admin/organization", label: "Organization", icon: "shield" },
    ],
  },
  {
    title: "Content Management",
    items: [
      { href: "/admin/blog", label: "Blog", icon: "pen" },
      { href: "/admin/pricing", label: "Pricing", icon: "card" },
      { href: "/admin/generator", label: "AI Content Studio", icon: "sparkle" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on path change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-line bg-surface/85 px-4 backdrop-blur-md md:hidden">
        <Link href="/admin" className="flex items-center gap-2.5 font-bold text-base text-text">
          <span className="logo-mark" />
          <span>Flowmetrics</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-muted hover:text-text transition-colors"
            aria-label="Toggle Navigation"
          >
            <Icon name="list" />
          </button>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Container: matches UI kit .side */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[244px] flex-col border-r border-line bg-surface p-3.5 transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  const [currentOrg, setCurrentOrg] = useState({
    name: "Flowmetrics Enterprise",
    slug: "flowmetrics-hq",
    role: "Owner",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("flowmetrics_current_org");
      if (saved) {
        setCurrentOrg(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Logo & Header */}
      <div className="px-2 pt-1 pb-3">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-[17px] text-text tracking-tight">
            <span className="logo-mark" />
            <span>Flowmetrics</span>
          </Link>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>

        {/* Current Active Workspace Indicator Pill */}
        <div className="mt-3.5 rounded-lg border border-line bg-surface-2/60 p-2.5 flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-semibold text-text truncate">{currentOrg.name}</div>
            <div className="text-[10px] text-muted flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-signal">/{currentOrg.slug}</span>
              <span>&middot;</span>
              <span className="tag" style={{ fontSize: "10px", padding: "1px 5px" }}>
                {currentOrg.role}
              </span>
            </div>
          </div>
          <Link
            href="/admin/settings"
            title="Workspace Settings & Appearance"
            className="text-xs text-muted hover:text-signal transition-colors p-1"
          >
            ⚙️
          </Link>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 overflow-y-auto px-1 py-2 space-y-1">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted px-2.5 pt-4 pb-1.5">
                {section.title}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-colors min-h-[38px] ${
                      active
                        ? "bg-signal/13 text-signal font-semibold"
                        : "text-muted hover:bg-surface-2 hover:text-text"
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer Navigation & Sign Out */}
      <div className="border-t border-line px-2 pt-3 mt-auto space-y-1">
        <Link
          href="/"
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-muted hover:text-text transition-colors rounded-md"
        >
          <span>🌐</span>
          <span>Back to website</span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2 w-full px-2.5 py-1.5 text-xs text-muted hover:text-danger transition-colors rounded-md text-left"
          >
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}
