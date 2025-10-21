import {
  integer,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { GitHubInstallationSetup } from "../../ty";
import { users } from "./users";

export type GitHubAccountType = "User" | "Organization";

export const gitHubInstallationTable = pgTable(
  "github_installation",
  {
    githubInstallationId: integer("github_installation_id").primaryKey(),
    githubAppId: integer("github_app_id").notNull(),
    accountId: integer("account_id").notNull(),
    // `account.login` - The account's username or organization name.
    accountLogin: varchar("account_login", { length: 255 }).notNull(),
    // `account.type` - 'User' or 'Organization'.
    accountType: varchar("account_type", { length: 64 })
      .$type<GitHubAccountType>()
      .notNull(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    setupAction: varchar("setup_action", { length: 64 })
      .$type<GitHubInstallationSetup>()
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("github_installation_app_id_user_id_account_login_key").on(
      table.githubAppId,
      table.userId,
      table.accountLogin
    ),
    unique("github_installation_app_id_user_id_account_id").on(
      table.githubAppId,
      table.userId,
      table.accountId
    ),
  ]
);

export type GitHubInstallationTable =
  typeof gitHubInstallationTable.$inferSelect;
