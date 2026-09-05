import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const isRemoteDb =
  process.env.DATABASE_SSL === "true" ||
  (connectionString &&
    !connectionString.includes("localhost") &&
    !connectionString.includes("127.0.0.1") &&
    !connectionString.includes("sslmode=disable"));

export const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: isRemoteDb ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        host: process.env.POSTGRES_SERVER || "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
        database: process.env.POSTGRES_DB || "flowmetrics",
        ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
);

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export async function query<T = unknown>(text: string, params?: unknown[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.DEBUG_SQL === "true") {
    console.log("Executed query:", { text, duration, rows: res.rowCount });
  }
  return res as { rows: T[]; rowCount: number };
}
