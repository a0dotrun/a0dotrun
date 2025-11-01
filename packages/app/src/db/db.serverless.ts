import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { PgTransaction, type PgTransactionConfig } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { env } from "../env";

namespace Context {
  export class NotFound extends Error {}

  export function create<T>() {
    const storage = new AsyncLocalStorage<T>();
    return {
      use() {
        const result = storage.getStore();
        if (!result) throw new NotFound();
        return result;
      },
      provide<R>(value: T, fn: () => R) {
        return storage.run<R>(value, fn);
      },
    };
  }
}

export namespace Database {
  export type Transaction = PgTransaction<
    PostgresJsQueryResultHKT,
    Record<string, never>,
    ExtractTablesWithRelations<Record<string, never>>
  >;

  const connectionString = env.DATABASE_URL;

  // This function creates a new database connection for each request.
  // This is ideal for serverless environments like Cloudflare Workers
  // where functions are short-lived.
  // Connection options keep the pool to a single client and disable prepared statements.
  function createScopedDb() {
    const raw = postgres(connectionString, {
      max: 1,
      idle_timeout: 0,
      prepare: false,
    });
    const db = drizzle(raw, { casing: "snake_case" });
    return {
      db,
      close: () => raw.end({ timeout: 0 }),
    };
  }

  async function finalizeScope(
    effects: (() => void | Promise<void>)[],
    close: () => Promise<void>,
    errored: boolean
  ) {
    const effectResults = await Promise.allSettled(
      effects.map((effect) => {
        try {
          return Promise.resolve(effect());
        } catch (error) {
          return Promise.reject(error);
        }
      })
    );

    const closeResult = await Promise.resolve(close())
      .then(() => ({ status: "fulfilled" as const }))
      .catch((reason) => ({ status: "rejected" as const, reason }));

    const failedEffects = effectResults.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );
    const cleanupErrors = [
      ...failedEffects.map((result) => result.reason),
      ...(closeResult.status === "rejected" ? [closeResult.reason] : []),
    ];

    if (cleanupErrors.length === 0) return;

    if (errored) {
      cleanupErrors.forEach((error) => {
        console.error("Database scope cleanup failed after request error:", error);
      });
      return;
    }

    throw cleanupErrors[0];
  }

  type DrizzleDb = ReturnType<typeof createScopedDb>["db"];
  export type TxOrDb = Transaction | DrizzleDb;

  const TransactionContext = Context.create<{
    tx: TxOrDb;
    effects: (() => void | Promise<void>)[];
  }>();

  export function db() {
    try {
      const { tx } = TransactionContext.use();
      return tx;
    } catch (err) {
      if (err instanceof Context.NotFound)
        throw new Error("Database.db() is not available outside request scope");
      throw err;
    }
  }

  export async function use<T>(callback: (trx: TxOrDb) => Promise<T>) {
    try {
      const { tx } = TransactionContext.use();
      return tx.transaction(callback);
    } catch (err) {
      if (err instanceof Context.NotFound) {
        const effects: (() => void | Promise<void>)[] = [];
        const scope = createScopedDb();
        let caught: unknown;
        try {
          return await TransactionContext.provide(
            {
              effects,
              tx: scope.db,
            },
            () => callback(scope.db)
          );
        } catch (error) {
          caught = error;
          throw error;
        } finally {
          await finalizeScope(effects, scope.close, caught !== undefined);
        }
      }
      throw err;
    }
  }

  export async function fn<Input, T>(
    callback: (input: Input, trx: TxOrDb) => Promise<T>
  ) {
    return (input: Input) => use(async (tx) => callback(input, tx));
  }

  export async function effect(effect: () => any | Promise<any>) {
    try {
      const { effects } = TransactionContext.use();
      effects.push(effect);
    } catch {
      await effect();
    }
  }

  export async function transaction<T>(
    callback: (tx: TxOrDb) => Promise<T>,
    config?: PgTransactionConfig
  ) {
    try {
      const { tx } = TransactionContext.use();
      return callback(tx);
    } catch (err) {
      if (err instanceof Context.NotFound) {
        const effects: (() => void | Promise<void>)[] = [];
        const scope = createScopedDb();
        let caught: unknown;
        try {
          return await scope.db.transaction(async (tx) => {
            return TransactionContext.provide({ tx, effects }, () =>
              callback(tx)
            );
          }, config);
        } catch (error) {
          caught = error;
          throw error;
        } finally {
          await finalizeScope(effects, scope.close, caught !== undefined);
        }
      }
      throw err;
    }
  }
}
