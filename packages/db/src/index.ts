import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { dbConfig } from "./config";
import * as schema from "./schema";

export const pool = new Pool({
  connectionString: dbConfig.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
