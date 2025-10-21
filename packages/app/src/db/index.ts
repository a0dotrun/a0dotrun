import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDatabase = ReturnType<typeof drizzle>;

interface DatabaseContext {
  client: PostgresClient;
  db: DrizzleDatabase;
}

const storage = new AsyncLocalStorage<DatabaseContext>();

function createContext(): DatabaseContext {
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle({ client, casing: "snake_case" });
  return { client, db };
}

async function runWithContext<T>(callback: () => Promise<T>): Promise<T> {
  const existing = storage.getStore();
  if (existing) {
    return callback();
  }

  const context = createContext();
  try {
    return await storage.run(context, callback);
  } finally {
    await context.client.end({ timeout: 0 }).catch(() => undefined);
  }
}

export namespace Database {
  export async function use<T>(callback: (db: DrizzleDatabase) => Promise<T>) {
    return runWithContext(() => callback(get()));
  }

  export async function transaction<T>(
    callback: (db: DrizzleDatabase) => Promise<T>,
  ) {
    return runWithContext(() => callback(get()));
  }

  export function get() {
    const context = storage.getStore();
    if (!context) {
      throw new Error(
        "Database context not found. Wrap the call in Database.use(...).",
      );
    }
    return context.db;
  }
}

export const db: DrizzleDatabase = new Proxy({} as DrizzleDatabase, {
  get(_target, prop, receiver) {
    const database = Database.get();
    const value = Reflect.get(database, prop, receiver);
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
});

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
