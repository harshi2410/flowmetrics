import { Button } from "@/components/ui/Button";

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="rounded-2xl border border-signal/30 bg-gradient-to-br from-surface to-ink p-10 text-center sm:p-16">
        <h2 className="mx-auto max-w-xl font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Give your team clarity on workload and capacity
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          Free for small teams up to 2 active projects. Upgrade only as your projects
          and team bandwidth expand.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button href="#pricing" size="md">
            Start Free Trial
          </Button>
          <Button href="#preview" size="md" variant="secondary">
            View Live Preview
          </Button>
        </div>
      </div>
    </section>
  );
}
