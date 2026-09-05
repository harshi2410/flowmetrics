import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const links = [
  { href: "#features", label: "Features" },
  { href: "#preview", label: "Preview" },
  { href: "#pricing", label: "Pricing" },
  { href: "#blog", label: "Blog" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 font-display text-base font-semibold">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-signal" />
          Flowmetrics
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-text">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/admin/login"
            className="rounded-md border border-line bg-surface px-3 py-1.5 text-sm font-medium text-text transition-colors hover:border-signal/50"
          >
            Sign In
          </Link>
          <Button href="#pricing" size="sm" className="hidden sm:inline-flex">
            Start Free Trial
          </Button>
        </div>
      </div>
    </header>
  );
}
