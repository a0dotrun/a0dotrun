import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { PgTransaction, type PgTransactionConfig } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";

function memo<T>(fn: () => T, cleanup?: (value: T) => Promise<void>) {
  let value: T | undefined;
  let loaded = false;

  const getter = (): T => {
    if (loaded) return value as T;
    value = fn();
    loaded = true;
    return value as T;
  };

  getter.reset = async () => {
    if (cleanup && value) await cleanup(value);
    loaded = false;
    value = undefined;
  };

  return getter;
}

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

  const connectionString = process.env.DATABASE_URL!;
  const client = memo(() => {
    const result = postgres(connectionString);
    const db = drizzle(result, { casing: "snake_case" });
    return db;
  });

  export type TxOrDb = Transaction | ReturnType<typeof client>;

  const TransactionContext = Context.create<{
    tx: TxOrDb;
    effects: (() => void | Promise<void>)[];
  }>();

  export function db() {
    try {
      const { tx } = TransactionContext.use();
      return tx;
    } catch (err) {
      if (err instanceof Context.NotFound) {
        const effects: (() => void | Promise<void>)[] = [];
        const result = TransactionContext.provide(
          {
            effects,
            tx: client(),
          },
          () => client()
        );
        return result;
      }
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
        const result = await TransactionContext.provide(
          {
            effects,
            tx: client(),
          },
          () => callback(client())
        );
        await Promise.all(effects.map((x) => x()));
        return result;
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
        const result = await client().transaction(async (tx) => {
          return TransactionContext.provide({ tx, effects }, () =>
            callback(tx)
          );
        }, config);
        await Promise.all(effects.map((x) => x()));
        return result;
      }
      throw err;
    }
  }
}
