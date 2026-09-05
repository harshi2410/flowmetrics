import { Button } from "@/components/ui/Button";
import { pricingPlans as defaultPlans, type PricingPlan } from "@/lib/data";

async function fetchPricing(): Promise<PricingPlan[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  try {
    const res = await fetch(`${apiUrl}/api/pricing`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((p: any) => ({
          id: p.id || p.name.toLowerCase(),
          name: p.name,
          tagline: p.description || p.tagline || "",
          price: Number(p.price),
          period: p.billing_cycle || p.period || "month",
          features: Array.isArray(p.features) ? p.features : [],
          highlighted: Boolean(p.highlighted),
        }));
      }
    }
  } catch {
    // fallback to local data
  }
  return defaultPlans;
}

export async function Pricing() {
  const pricingPlans = await fetchPricing();

  return (
    <section id="pricing" className="border-t border-line/70 bg-surface/40">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-lg">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Pricing that scales with your team
          </h2>
          <p className="mt-3 text-muted">
            Start free with small teams. Upgrade as your projects, active contributors,
            and capacity planning requirements grow.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl border p-6 ${
                plan.highlighted
                  ? "border-signal/50 bg-ink shadow-[0_20px_60px_-30px_rgba(67,224,198,0.35)]"
                  : "border-line bg-ink"
              }`}
            >
              {plan.highlighted && (
                <span className="mb-4 w-fit rounded-full bg-signal/15 px-2.5 py-1 text-xs font-medium text-signal">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
              <p className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-3xl font-semibold">
                  ${plan.price}
                </span>
                <span className="text-sm text-muted">/{plan.period}</span>
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-signal"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8.5L6.2 11.5L13 4.5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                href="#pricing"
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-7 w-full"
              >
                {plan.price === 0 ? "Start Free Trial" : "Choose " + plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
