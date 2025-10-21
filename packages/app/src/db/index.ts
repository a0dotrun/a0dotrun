import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle({ client, casing: "snake_case" });

// import { drizzle } from "drizzle-orm/node-postgres";
// import { Pool } from "pg";

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// export type DrizzleDB = typeof db;

// const db = drizzle({ client: pool, casing: "snake_case" });

// export { db };

// import { drizzle } from "drizzle-orm/neon-http";

// const db = drizzle(process.env.DATABASE_URL!);

// export type DrizzleDB = typeof db;

// export { db };
