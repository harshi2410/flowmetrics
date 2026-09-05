import { getPricingPlans } from "@/lib/services/pricing.service";
import { PricingPlanEditor } from "@/components/admin/PricingPlanEditor";

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  const pricingPlans = await getPricingPlans();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Pricing
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Update plan pricing, billing cycle, descriptions, repeatable features, and highlighted status.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {pricingPlans.map((plan) => (
          <PricingPlanEditor key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
