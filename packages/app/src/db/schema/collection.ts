import { pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";
import { serverTable } from "./server";

export const collectionTable = pgTable("collection", {
  collectionId: varchar("collection_id", { length: 255 })
    .primaryKey()
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).unique().notNull(),
  description: varchar("description", { length: 511 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const serverCollectionTable = pgTable(
  "server_collection",
  {
    serverId: varchar("server_id", { length: 255 })
      .notNull()
      .references(() => serverTable.serverId, { onDelete: "cascade" }),
    collectionId: varchar("collection_id", { length: 255 })
      .notNull()
      .references(() => collectionTable.collectionId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      name: "server_id_collection_id_pk",
      columns: [table.serverId, table.collectionId],
    }),
  ]
);
