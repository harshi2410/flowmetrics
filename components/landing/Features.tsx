import { features } from "@/lib/data";

export function Features() {
  return (
    <section id="features" className="border-t border-line/70 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-lg">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything between capacity and delivery
          </h2>
          <p className="mt-3 text-muted">
            Four tools give engineering managers and agency leaders instant visibility
            into workload, velocity, and team capacity.
          </p>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="bg-ink p-6 transition-colors hover:bg-surface sm:p-7">
              <h3 className="font-display text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
