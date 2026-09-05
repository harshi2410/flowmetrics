import { z } from "zod";

export const createPricingSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  billing_cycle: z.enum(["month", "year"]).default("month"),
  description: z.string().optional().default(""),
  features: z
    .array(z.string().min(1, "Feature item cannot be empty"))
    .min(1, "At least one feature is required"),
  highlighted: z.boolean().optional().default(false),
});

export const updatePricingSchema = createPricingSchema.partial();

export type CreatePricingInput = z.infer<typeof createPricingSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;
