import { Router } from "express";
import { getPublicPricing } from "../controllers/pricing.controller.js";

export const pricingRouter = Router();

// Public pricing route
pricingRouter.get("/", getPublicPricing);
