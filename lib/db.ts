import { Pool, type QueryResult, type QueryResultRow } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/flowmetrics?sslmode=disable";

const globalForPg = globalThis as unknown as {
  __flowmetricsPgPool?: Pool;
};

export const pool: Pool =
  globalForPg.__flowmetricsPgPool ??
  new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl:
      process.env.NODE_ENV === "production" && !connectionString.includes("sslmode=disable")
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.__flowmetricsPgPool = pool;
}

pool.on("error", (err) => {
  console.warn("PostgreSQL client pool notice:", err?.message || err);
});

/**
 * Execute a parameterized query with node-postgres.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.DEBUG_SQL === "true") {
      console.log("Executed query", { text, duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    if (process.env.DEBUG_SQL === "true") {
      console.error("PostgreSQL Query Error:", { text, params, error });
    }
    throw error;
  }
}

/**
 * Acquire a client from the pool for transactions.
 */
export async function getClient() {
  return await pool.connect();
}

/**
 * Verify database connectivity.
 */
export async function checkDbConnection(): Promise<boolean> {
  try {
    const res = await pool.query("SELECT 1 as connected");
    return res.rows[0]?.connected === 1;
  } catch {
    return false;
  }
}
