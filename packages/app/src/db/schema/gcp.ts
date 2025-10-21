// import { pgTable, varchar, timestamp, unique } from "drizzle-orm/pg-core";
// import { CloudBuildStatus } from "../../infra/providers/gcp";

// export const GCPBuildLogTable = pgTable(
//   "gcp_build_log",
//   {
//     id: varchar("id", { length: 255 }).primaryKey(),
//     buildId: varchar("build_id", { length: 255 }).notNull(),
//     deploymentId: varchar("deployment_id", { length: 255 }).notNull(),
//     status: varchar("status", { length: 64 })
//       .$type<CloudBuildStatus>()
//       .notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//     updatedAt: timestamp("updated_at").defaultNow().notNull(),
//   },

//   (table) => [
//     unique("gcp_build_log_build_id_deployment_id").on(
//       table.buildId,
//       table.deploymentId
//     ),
//   ]
// );
