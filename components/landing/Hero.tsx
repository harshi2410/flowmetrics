import { getRecentEvents } from "@/lib/services/analytics.service";

const fallbackEvents = [
  { name: "sprint_completed", meta: "Frontend Squad · 98% velocity", tone: "signal" as const },
  { name: "capacity_warning", meta: "Design Team · 112% allocated", tone: "muted" as const },
  { name: "milestone_reached", meta: "Mobile App v2.4 · On schedule", tone: "signal" as const },
  { name: "workload_balanced", meta: "Backend Squad · 85% capacity", tone: "signal" as const },
  { name: "blocker_resolved", meta: "Core Platform · 4 tasks unblocked", tone: "muted" as const },
];

export async function Hero() {
  let events = fallbackEvents;
  try {
    const liveEvents = await getRecentEvents(5);
    if (liveEvents && liveEvents.length > 0) {
      events = liveEvents;
    }
  } catch {
    // Graceful fallback if database is loading
  }

  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-8">
        <div>
          <p className="font-data text-xs font-medium text-signal">Team productivity & workload analytics</p>
          <h1 className="mt-4 max-w-lg font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            See where your team&apos;s time and effort go
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
            Flowmetrics gives managers a clear view of workload, project progress,
            and team capacity — all in one place.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#pricing"
              className="inline-flex items-center justify-center rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-signal/90"
            >
              Start Free Trial
            </a>
            <a
              href="#preview"
              className="inline-flex items-center justify-center rounded-md border border-line bg-surface px-5 py-2.5 text-sm font-medium text-text transition-colors hover:border-signal/50"
            >
              View Live Preview
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">
            Free for small teams up to 2 active projects. No credit card required.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between px-1.5 pb-3">
            <p className="text-sm font-medium text-text">Live team workload stream</p>
            <span className="flex items-center gap-1.5 font-data text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-signal" />
              active
            </span>
          </div>
          <div className="flex flex-col divide-y divide-line/70 border-t border-line/70">
            {events.map((event, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-1.5 py-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      event.tone === "signal" ? "bg-signal" : "bg-muted/50"
                    }`}
                  />
                  <span className="font-data text-sm text-text">{event.name}</span>
                </div>
                <span className="whitespace-nowrap font-data text-xs text-muted">
                  {event.meta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
