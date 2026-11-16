import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().optional(),
  POSTGRES_SERVER: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("postgres"),
  POSTGRES_DB: z.string().default("flowmetrics"),
  DATABASE_SSL: z.string().optional().default("false"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters for security").default("flowmetrics-enterprise-platform-secret-key-2026"),
  OPENAI_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().default("admin@flowmetrics.io"),
  ADMIN_PASSWORD: z.string().default("flowmetrics2026"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid Environment Configuration:");
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  if (process.env.NODE_ENV === "production") {
    throw new Error("Application cannot start in production with invalid environment variables.");
  }
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({
  NODE_ENV: "development",
  PORT: 5000,
  CLIENT_URL: "http://localhost:3000",
  POSTGRES_SERVER: "localhost",
  POSTGRES_PORT: 5432,
  POSTGRES_USER: "postgres",
  POSTGRES_PASSWORD: "postgres",
  POSTGRES_DB: "flowmetrics",
  DATABASE_SSL: "false",
  JWT_SECRET: "flowmetrics-enterprise-platform-secret-key-2026",
  ADMIN_EMAIL: "admin@flowmetrics.io",
  ADMIN_PASSWORD: "flowmetrics2026",
});
