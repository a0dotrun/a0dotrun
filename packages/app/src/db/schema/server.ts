import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ulid } from "ulid";
import z from "zod/v4";
import { genId } from "@riverly/utils";
import {
  type ServerLicense as ServerLicenseType,
  type ServerReadme as ServerReadmeType,
  Envs,
  EnvsSchema,
  ServerConfig,
  ServerConfigSchema,
  ServerLicenseSchema,
  ServerReadmeSchema,
  ServerMode,
  ServerModeEnum,
  ServerTransport,
  ServerTransportEnum,
  ServerVisibility,
  ServerVisibilityEnum,
} from "../../ty";
import { users } from "./users";

export const serverTable = pgTable(
  "server",
  {
    serverId: varchar("server_id", { length: 255 })
      .primaryKey()
      .notNull()
      .$defaultFn(() => genId()),
    name: varchar("name", { length: 255 }).notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    avatarUrl: varchar("avatar_url", { length: 511 }),
    isClaimed: boolean("is_claimed").default(false).notNull(), // is GitHub connected
    usageCount: integer("usage_count").default(0).notNull(),
    visibility: varchar("visibility", { length: 64 })
      .$type<ServerVisibility>()
      .notNull(),
    // repository
    githubRepo: varchar("github_repo", { length: 255 }),
    githubOwner: varchar("github_owner", { length: 255 }),
    githubRepositoryId: integer("github_repository_id"),
    branch: varchar("branch", { length: 255 }),
    // runtime
    mode: varchar("mode", { length: 64 }).$type<ServerMode>().notNull(),
    transport: varchar("transport", { length: 64 })
      .$type<ServerTransport>()
      .notNull(),
    // ownership
    userId: varchar("user_id", { length: 255 })
      .references(() => users.id)
      .notNull(),
    addedById: varchar("addedby_id", { length: 255 })
      .references(() => users.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    // public
    homepage: varchar("homepage", { length: 511 }),
    readme: jsonb("readme").$type<ServerReadmeType>(),
    license: jsonb("license").$type<ServerLicenseType>(),
  },
  (table) => [unique("server_username_name_key").on(table.username, table.name)]
);

// Represents fullview of insert schema for a server
// other views are derived from this.
export const CreateServer = createInsertSchema(serverTable, {
  name: z.string(),
  username: z.string(),
  title: z.string(),
  description: z.string().optional().default(""),
  avatarUrl: z.url().optional(),
  isClaimed: z.boolean().optional(),
  usageCount: z.number().optional(),
  visibility: z
    .enum([ServerVisibilityEnum.PRIVATE, ServerVisibilityEnum.PUBLIC])
    .optional()
    .default(ServerVisibilityEnum.PRIVATE),
  githubRepo: z.string().optional(),
  githubOwner: z.string().optional(),
  branch: z.string().optional(),
  githubRepositoryId: z.number().optional(),
  mode: z
    .enum([ServerModeEnum.REMOTE, ServerModeEnum.LOCAL])
    .optional()
    .default(ServerModeEnum.REMOTE),
  transport: z
    .enum([ServerTransportEnum.HTTP, ServerTransportEnum.STDIO])
    .optional()
    .default(ServerTransportEnum.HTTP),
  userId: z.string(),
  addedById: z.string(),
  homepage: z.url().optional(),
  readme: ServerReadmeSchema.optional(),
  license: ServerLicenseSchema.optional(),
});

export const SelectServer = createSelectSchema(serverTable, {
  visibility: ServerVisibility,
  mode: ServerMode,
  transport: ServerTransport,
  readme: ServerReadmeSchema.nullable(),
  license: ServerLicenseSchema.nullable(),
});

// Derived schema from main schema for creating server
// with API.
export const AddServer = CreateServer.pick({
  name: true,
  title: true,
  visibility: true,
  userId: true,
  username: true,
  addedById: true,
})
  .required()
  .extend({
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
  });

// Derived schema from main schema for creating
// server from GitHub linked repository.
export const GitHubCreateServer = CreateServer.pick({
  name: true,
  username: true,
  title: true,
  visibility: true,
  githubRepo: true,
  githubOwner: true,
  branch: true,
  githubRepositoryId: true,
  isClaimed: true,
  userId: true,
  addedById: true,
})
  .required()
  .extend({
    description: z.string().optional(),
    avatarUrl: z.string().optional(),
    license: ServerLicenseSchema.optional(),
    readme: ServerReadmeSchema.optional(),
  });

// Derived schema for initializing adding a server from GitHub
// with additional attributes required for fetching repository details.
export const GitHubImportServer = AddServer.required().extend({
  repoUrl: z.string(), // required for fetching repo details
  description: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const serverConfigTable = pgTable("server_config", {
  serverId: varchar("server_id", { length: 255 })
    .notNull()
    .primaryKey()
    .references(() => serverTable.serverId, { onDelete: "cascade" }),
  userId: varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  revision: varchar("revision", { length: 128 })
    .notNull()
    .$defaultFn(() => ulid().toLowerCase()),
  envs: jsonb("envs").$type<Envs>().notNull().default([]),
  config: jsonb("config").$type<ServerConfig>().notNull().default({}),
  configHash: varchar("config_hash", { length: 511 }).notNull(),
  rootDir: varchar("root_dir", { length: 255 }).default("./").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MCPServerConfigTable = typeof serverConfigTable.$inferSelect;

export const InsertServerConfig = createInsertSchema(serverConfigTable, {
  serverId: z.string(),
  userId: z.string(),
  envs: EnvsSchema.optional(),
  config: ServerConfigSchema.optional(),
  configHash: z.string(),
  rootDir: z.string().optional().default("./"),
});

export const UpsertServerConfig = InsertServerConfig.omit({
  configHash: true,
});

export type UpsertServerConfig = z.infer<typeof UpsertServerConfig>;

export const serverInstallTable = pgTable(
  "server_install",
  {
    installId: varchar("install_id", { length: 255 })
      .primaryKey()
      .notNull()
      .$defaultFn(() => genId()),
    userId: varchar("user_id", { length: 255 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    serverId: varchar("server_id", { length: 255 })
      .notNull()
      .references(() => serverTable.serverId, { onDelete: "cascade" }),
    usageCount: integer("usage_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("server_install_user_id_server_id_key").on(
      table.userId,
      table.serverId
    ),
  ]
);

export const serverViewTable = pgTable(
  "server_view",
  {
    viewId: varchar("view_id", { length: 255 })
      .primaryKey()
      .notNull()
      .$defaultFn(() => genId()),
    userId: varchar("user_id", { length: 255 })
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    serverId: varchar("server_id", { length: 255 })
      .notNull()
      .references(() => serverTable.serverId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("server_view_user_id_server_id_key").on(
      table.userId,
      table.serverId
    ),
  ]
);
