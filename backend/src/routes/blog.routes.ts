import { Router } from "express";
import { getPublicBlogs, getPublicBlogBySlug } from "../controllers/blog.controller.js";

export const blogRouter = Router();

// Public blog routes (Only published posts)
blogRouter.get("/", getPublicBlogs);
blogRouter.get("/:slug", getPublicBlogBySlug);
