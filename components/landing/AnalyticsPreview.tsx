const bars = [42, 58, 52, 68, 64, 76, 72, 84, 80, 92, 88, 96];
const projectProgress = [
  { label: "Design System & Specs", value: 100 },
  { label: "Core API & Data Architecture", value: 85 },
  { label: "Frontend Modules & Dashboard", value: 68 },
  { label: "QA & Production Readiness", value: 45 },
];

export function AnalyticsPreview() {
  return (
    <section id="preview" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-lg">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          The manager dashboard, before you sign up
        </h2>
        <p className="mt-3 text-muted">
          A preview of how workload distribution, sprint velocity, and project health look in practice.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text">Weekly team velocity & focus</p>
            <p className="font-data text-xs text-muted">Last 12 sprints</p>
          </div>
          <div className="mt-6 flex h-40 items-end gap-2.5 sm:gap-3">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-signal/25" style={{ height: `${h}%` }}>
                <div
                  className="h-1.5 w-full rounded-t bg-signal"
                  style={{ marginTop: 0 }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6">
          <p className="text-sm font-medium text-text">Active project progress</p>
          <div className="mt-6 flex flex-col gap-4">
            {projectProgress.map((step) => (
              <div key={step.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-muted">{step.label}</span>
                  <span className="font-data text-text">{step.value}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-surface-2">
                  <div
                    className="h-1.5 rounded-full bg-signal"
                    style={{ width: `${step.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
