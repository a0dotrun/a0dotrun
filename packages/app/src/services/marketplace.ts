import { and, count, desc, eq, gt } from "drizzle-orm";
import { Database, db } from "../db";
import { serverInstallTable, serverTable, serverViewTable } from "../db/schema";
import { fn } from "@a0dotrun/utils";
import z from "zod/v4";

export namespace ServerTracker {
  const withDatabase = <T>(callback: () => Promise<T>) =>
    Database.use(callback);

  export const recentlyViewedServers = fn(
    z.object({ userId: z.string(), limit: z.number().default(3) }),
    async (filter) => {
      return withDatabase(() =>
        db
          .select({
            viewId: serverViewTable.viewId,
            usageCount: serverTable.usageCount,
            serverId: serverTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            avatarUrl: serverTable.avatarUrl,
            isClaimed: serverTable.isClaimed,
            description: serverTable.description,
          })
          .from(serverViewTable)
          .innerJoin(
            serverTable,
            eq(serverViewTable.serverId, serverTable.serverId)
          )
          .where(eq(serverViewTable.userId, filter.userId))
          .orderBy(desc(serverViewTable.createdAt))
          .limit(filter.limit)
      );
    }
  );

  export const recentViewed = fn(
    z.object({ userId: z.string(), serverId: z.string() }),
    async (insert) =>
      withDatabase(() =>
        db.transaction(async (tx) => {
          return tx
            .insert(serverViewTable)
            .values({ ...insert })
            .onConflictDoNothing()
            .returning({ viewId: serverViewTable.viewId })
            .execute()
            .then((rows) => rows[0]);
        })
      )
  );

  export const activeCount = fn(z.string(), async (userId) => {
    return withDatabase(() =>
      db
        .select({
          count: count(serverInstallTable.installId),
        })
        .from(serverInstallTable)
        .where(
          and(
            eq(serverInstallTable.userId, userId),
            gt(serverInstallTable.usageCount, 0)
          )
        )
        .execute()
        .then((row) => row[0]?.count ?? 0)
    );
  });

  export const topUsedServers = fn(
    z.object({ userId: z.string(), limit: z.number() }),
    async (filter) => {
      return withDatabase(() =>
        db
          .select({
            installId: serverInstallTable.installId,
            usageCount: serverInstallTable.usageCount,
            serverId: serverInstallTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            avatarUrl: serverTable.avatarUrl,
            isClaimed: serverTable.isClaimed,
          })
          .from(serverInstallTable)
          .innerJoin(
            serverTable,
            eq(serverInstallTable.serverId, serverTable.serverId)
          )
          .where(
            and(
              eq(serverInstallTable.userId, filter.userId),
              gt(serverInstallTable.usageCount, 0)
            )
          )
          .orderBy(desc(serverInstallTable.usageCount))
          .limit(filter.limit)
      );
    }
  );
}
