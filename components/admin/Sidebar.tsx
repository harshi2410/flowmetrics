"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/pricing", label: "Pricing" },
  { href: "/admin/blog", label: "Blog" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface p-5 md:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      <nav className="flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2.5 md:hidden">
        <div className="flex gap-1 overflow-x-auto">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-signal/15 text-signal" : "text-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form action={logout} className="shrink-0">
            <button
              type="submit"
              className="rounded-md px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:text-danger"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 font-display text-base font-semibold">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-signal" />
            Flowmetrics
          </div>
          <p className="mt-0.5 text-xs text-muted">Admin</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-signal/15 text-signal"
                  : "text-muted hover:bg-ink hover:text-text"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <form action={logout} className="mt-6 border-t border-line pt-4">
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-ink hover:text-danger"
        >
          Logout
        </button>
      </form>
    </>
  );
}
