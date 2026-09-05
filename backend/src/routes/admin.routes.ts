import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import { writeRateLimiter } from "../middleware/rateLimit.middleware.js";
import {
  getAdminPricing,
  createPricing,
  updatePricing,
  deletePricing,
} from "../controllers/pricing.controller.js";
import {
  getAdminBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller.js";
import { getAdminStats } from "../controllers/stats.controller.js";

export const adminRouter = Router();

// Apply Authentication and Admin-role checks to all /api/admin/* endpoints
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// CMS Dashboard Stats
adminRouter.get("/stats", getAdminStats);

// Pricing Plan Admin CRUD
adminRouter.get("/pricing", getAdminPricing);
adminRouter.post("/pricing", writeRateLimiter, createPricing);
adminRouter.put("/pricing/:id", writeRateLimiter, updatePricing);
adminRouter.delete("/pricing/:id", writeRateLimiter, deletePricing);

// Blog Posts Admin CRUD
adminRouter.get("/blog", getAdminBlogs);
adminRouter.post("/blog", writeRateLimiter, createBlog);
adminRouter.put("/blog/:id", writeRateLimiter, updateBlog);
adminRouter.delete("/blog/:id", writeRateLimiter, deleteBlog);
