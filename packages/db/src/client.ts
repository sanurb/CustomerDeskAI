import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { keys } from "../keys";

// biome-ignore lint/performance/noNamespaceImport: drizzle expects a namespace import
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: keys().DATABASE_URL,
});

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});
