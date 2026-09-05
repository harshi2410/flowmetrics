import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-2 font-display text-base font-semibold">
          <span className="inline-block h-2 w-2 rounded-full bg-signal" />
          Flowmetrics
        </div>
        <p className="text-sm text-muted">
          &copy; {new Date().getFullYear()} Flowmetrics. Built for a hiring challenge.
        </p>
        <div className="flex gap-6 text-sm text-muted">
          <Link href="#features" className="hover:text-text">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-text">
            Pricing
          </Link>
          <Link href="#blog" className="hover:text-text">
            Blog
          </Link>
          <Link href="/admin/login" className="hover:text-text">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
