import { fn, NamedError } from "@riverly/utils";
import { createHash } from "crypto";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { ulid } from "ulid";
import z from "zod/v4";
import { env } from "../env";
import { Database } from "../db";
import { defaultAvatarUrl, parseRepoUrl } from "./helpers";
import {
  AddServer,
  collectionTable,
  CreateServer,
  GitHubCreateServer,
  GitHubImportServer,
  SelectServer,
  serverCollectionTable,
  serverConfigTable,
  serverInstallTable,
  serverTable,
  UpsertServerConfig,
  users,
} from "../db/schema";
import { ServerModeEnum, ServerVisibility, ServerVisibilityEnum } from "../ty";
import { GitHub } from "./github";

export function serverHomepage(username: string, name: string) {
  return `https://${env.BASEURL}/servers/${username}/${name}`;
}

export const ServerAddError = NamedError.create(
  "ServerAddError",
  z.object({
    message: z.string(),
  })
);

export const GitHubError = NamedError.create(
  "GitHubError",
  z.object({
    message: z.string(),
    githubAppId: z.number().optional(),
  })
);

export namespace Server {
  export const serversInCollection = fn(
    z.object({ name: z.string(), limit: z.number().default(3) }),
    async (filter) =>
      await Database.use((db) =>
        db
          .select({
            serverId: serverTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            description: serverTable.description,
            isClaimed: serverTable.isClaimed,
            repository: serverTable.githubRepo,
            avatarUrl: serverTable.avatarUrl,
            usageCount: serverTable.usageCount,
            visibility: serverTable.visibility,
            mode: serverTable.mode,
            homepage: serverTable.homepage,
            license: serverTable.license,
            readme: serverTable.readme,
          })
          .from(serverTable)
          .innerJoin(
            serverCollectionTable,
            eq(serverTable.serverId, serverCollectionTable.serverId)
          )
          .innerJoin(
            collectionTable,
            eq(serverCollectionTable.collectionId, collectionTable.collectionId)
          )
          .where(
            and(
              eq(collectionTable.name, filter.name),
              eq(serverTable.visibility, ServerVisibilityEnum.PUBLIC),
              eq(serverTable.mode, ServerModeEnum.REMOTE)
            )
          )
          .orderBy(desc(serverTable.usageCount))
          .limit(filter.limit)
      )
  );

  export const fromName = fn(
    z.object({
      callerUserId: z.string(),
      username: z.string(),
      name: z.string(),
    }),
    async (filter) => {
      const result = await Database.use((db) =>
        db
          .select({
            serverId: serverTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            description: serverTable.description,
            isClaimed: serverTable.isClaimed,
            repository: serverTable.githubRepo,
            avatarUrl: serverTable.avatarUrl,
            usageCount: serverTable.usageCount,
            visibility: serverTable.visibility,
            mode: serverTable.mode,
            homepage: serverTable.homepage,
            owner: {
              username: users.username,
              userId: users.id,
              name: users.name,
              image: users.image,
              isStaff: users.isStaff,
              isBlocked: users.isBlocked,
            },
            license: serverTable.license,
            readme: serverTable.readme,
          })
          .from(serverTable)
          .innerJoin(users, eq(users.id, serverTable.userId))
          .where(
            and(
              eq(serverTable.username, filter.username),
              eq(serverTable.name, filter.name)
            )
          )
          .execute()
          .then((row) => row.at(0))
      );
      if (!result) return result;
      // check for visibility, if private then check ownership,
      // if public return server
      if (result.visibility === ServerVisibilityEnum.PRIVATE) {
        if (filter.callerUserId === result.owner.userId) return result;
        else return undefined;
      }
      return result;
    }
  );

  export const publicServer = fn(
    z.object({ username: z.string(), name: z.string() }),
    async (filter) =>
      await Database.use((db) =>
        db
          .select({
            serverId: serverTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            description: serverTable.description,
            isClaimed: serverTable.isClaimed,
            repository: serverTable.githubRepo,
            avatarUrl: serverTable.avatarUrl,
            usageCount: serverTable.usageCount,
            visibility: serverTable.visibility,
            mode: serverTable.mode,
            homepage: serverTable.homepage,
            owner: {
              username: users.username,
              userId: users.id,
              name: users.name,
              image: users.image,
              isStaff: users.isStaff,
              isBlocked: users.isBlocked,
            },
            license: serverTable.license,
            readme: serverTable.readme,
          })
          .from(serverTable)
          .innerJoin(users, eq(users.id, serverTable.userId))
          .where(
            and(
              eq(serverTable.username, filter.username),
              eq(serverTable.name, filter.name),
              eq(serverTable.visibility, ServerVisibilityEnum.PUBLIC)
            )
          )
          .execute()
          .then((row) => row.at(0))
      )
  );

  export const ownedServer = fn(
    z.object({ username: z.string(), name: z.string() }),
    async (filter) =>
      await Database.use((db) =>
        db
          .select()
          .from(serverTable)
          .where(
            and(
              eq(serverTable.username, filter.username),
              eq(serverTable.name, filter.name)
            )
          )
          .execute()
          .then((row) => row.at(0))
      )
  );

  export const userServers = fn(
    z.object({
      username: z.string(),
      visibility: z.enum([
        ServerVisibilityEnum.PRIVATE,
        ServerVisibilityEnum.PUBLIC,
        "both",
      ]),
      limit: z.number().default(100),
    }),
    async (filter) => {
      const condition =
        filter.visibility === "both"
          ? or(
              eq(serverTable.visibility, ServerVisibilityEnum.PUBLIC),
              eq(serverTable.visibility, ServerVisibilityEnum.PRIVATE)
            )
          : eq(serverTable.visibility, filter.visibility as ServerVisibility);

      return await Database.use((db) =>
        db
          .select({
            serverId: serverTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            description: serverTable.description,
            isClaimed: serverTable.isClaimed,
            repository: serverTable.githubRepo,
            avatarUrl: serverTable.avatarUrl,
            usageCount: serverTable.usageCount,
            visibility: serverTable.visibility,
            mode: serverTable.mode,
            homepage: serverTable.homepage,
            owner: {
              username: users.username,
              userId: users.id,
              name: users.name,
              image: users.image,
              isStaff: users.isStaff,
              isBlocked: users.isBlocked,
            },
            license: serverTable.license,
            readme: serverTable.readme,
          })
          .from(serverTable)
          .innerJoin(users, eq(serverTable.userId, users.id))
          .where(and(eq(users.username, filter.username), condition))
          .orderBy(desc(serverTable.usageCount))
          .limit(filter.limit)
      );
    }
  );

  export const userInstalledServers = fn(
    z.object({
      userId: z.string(),
      visibility: z.enum([
        ServerVisibilityEnum.PRIVATE,
        ServerVisibilityEnum.PUBLIC,
        "both",
      ]),
      limit: z.number(),
    }),
    async (filter) => {
      const condition =
        filter.visibility === "both"
          ? or(
              eq(serverTable.visibility, ServerVisibilityEnum.PUBLIC),
              eq(serverTable.visibility, ServerVisibilityEnum.PRIVATE)
            )
          : eq(serverTable.visibility, filter.visibility as ServerVisibility);
      return await Database.use((db) =>
        db
          .select({
            serverId: serverTable.serverId,
            name: serverTable.name,
            username: serverTable.username,
            title: serverTable.title,
            description: serverTable.description,
            isClaimed: serverTable.isClaimed,
            repository: serverTable.githubRepo,
            avatarUrl: serverTable.avatarUrl,
            usageCount: serverTable.usageCount,
            visibility: serverTable.visibility,
            mode: serverTable.mode,
            homepage: serverTable.homepage,
            owner: {
              username: users.username,
              userId: users.id,
              name: users.name,
              image: users.image,
              isStaff: users.isStaff,
              isBlocked: users.isBlocked,
            },
            license: serverTable.license,
            readme: serverTable.readme,
          })
          .from(serverInstallTable)
          .innerJoin(
            serverTable,
            eq(serverInstallTable.serverId, serverTable.serverId)
          )
          .innerJoin(users, eq(serverInstallTable.userId, users.id))
          .where(and(eq(serverInstallTable.userId, filter.userId), condition))
          .orderBy(desc(serverTable.usageCount), desc(serverTable.createdAt))
          .limit(filter.limit)
      );
    }
  );

  export const addNew = fn(AddServer, async (server) => {
    return await Database.transaction(async (tx) => {
      const homepage = serverHomepage(server.username, server.name);
      const parsed = CreateServer.safeParse(server);
      if (!parsed.success)
        throw new ServerAddError({ message: parsed.error.message });

      const [newServer] = await tx
        .insert(serverTable)
        .values({ ...parsed.data, homepage })
        .returning();
      if (!newServer)
        throw new ServerAddError({ message: "Failed to insert new server" });

      await tx.insert(serverInstallTable).values({
        serverId: newServer.serverId,
        userId: server.userId,
      });
      return newServer;
    });
  });

  export const importFromGitHub = fn(
    GitHubImportServer.extend({ githubAppId: z.number() }),
    async (server) => {
      const [parseErr, pr] = parseRepoUrl(server.repoUrl);
      if (parseErr || !pr)
        throw new GitHubError({ message: "Bad GitHub repo name or URL" });

      const ghInstalled = await GitHub.userInstallation({
        userId: server.userId,
        githubAppId: server.githubAppId,
        account: pr.owner,
      });
      if (!ghInstalled)
        throw new GitHubError({
          message: "GitHub account is not connected",
          githubAppId: server.githubAppId,
        });

      const repo = await GitHub.repoDetail({
        githubInstallationId: ghInstalled.githubInstallationId,
        owner: pr.owner,
        repo: pr.repo,
      });
      if (!repo)
        throw new GitHubError({
          message: "Repo does not exist or not connected",
        });

      const repoReadme = await GitHub.repoReadme({
        githubInstallationId: ghInstalled.githubInstallationId,
        username: repo.owner.login,
        name: repo.name,
      });

      const request: z.infer<typeof GitHubCreateServer> = {
        name: server.name,
        title: server.title,
        description: server.description,
        visibility: server.visibility,
        userId: server.userId,
        addedById: server.addedById,
        username: server.username,
        githubRepo: repo.name,
        githubOwner: repo.owner.login,
        branch: repo.defaultBranch,
        githubRepositoryId: repo.id,
        license: repo.license ? { name: repo.license.name } : undefined,
        readme: repoReadme ?? undefined,
        isClaimed: true,
      };

      const requestParsed = GitHubCreateServer.safeParse(request);
      if (!requestParsed.success)
        throw new GitHubError({
          message: "Failed GitHub import schema validation",
        });

      return await Database.transaction(async (tx) => {
        const homepage = serverHomepage(
          requestParsed.data.username,
          requestParsed.data.githubRepo
        );
        const parsed = CreateServer.safeParse({
          ...requestParsed.data,
          avatarUrl:
            requestParsed.data.avatarUrl ??
            defaultAvatarUrl(requestParsed.data.name),
          homepage,
        });
        if (!parsed.success) {
          throw new GitHubError({
            message: "Failed GitHub create server schema validation",
          });
        }

        const [newServer] = await tx
          .insert(serverTable)
          .values(parsed.data)
          .returning();

        if (!newServer)
          throw new GitHubError({
            message: "Failed to insert GitHub import server",
          });

        await tx.insert(serverInstallTable).values({
          serverId: newServer.serverId,
          userId: newServer.userId,
        });
        return newServer;
      });
    }
  );

  export function generateConfigHash(config: Record<string, any>): string {
    const configString = JSON.stringify(config, Object.keys(config).sort());
    return createHash("sha256").update(configString).digest("hex");
  }

  export const config = fn(z.string(), async (serverId) => {
    return await Database.transaction(async (tx) =>
      tx
        .select()
        .from(serverConfigTable)
        .where(eq(serverConfigTable.serverId, serverId))
        .execute()
        .then((row) => row[0])
    );
  });

  export const upsertConfig = fn(UpsertServerConfig, async (upsert) => {
    return await Database.transaction(async (tx) => {
      const configHash = generateConfigHash(upsert.config ?? {});
      return tx
        .insert(serverConfigTable)
        .values({ ...upsert, configHash })
        .onConflictDoUpdate({
          target: serverConfigTable.serverId,
          set: {
            envs: upsert.envs,
            config: upsert.config,
            configHash: configHash,
            rootDir: upsert.rootDir,
            revision: ulid().toLowerCase(),
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        })
        .returning()
        .execute()
        .then((row) => row[0]);
    });
  });
}

// const ServerView = SelectServer;

export const ServerView = SelectServer.pick({
  serverId: true,
  name: true,
  username: true,
  title: true,
  description: true,
  isClaimed: true,
  repository: true,
  avatarUrl: true,
  usageCount: true,
  visibility: true,
  mode: true,
  homepage: true,
  license: true,
  readme: true,
});

export type ServerView = z.infer<typeof ServerView>;

export const ServerInstalledSlimView = ServerView.pick({
  serverId: true,
  name: true,
  username: true,
  title: true,
  avatarUrl: true,
  isClaimed: true,
  usageCount: true,
}).extend({
  installId: z.string(),
});

export type ServerInstallViewSlim = z.infer<typeof ServerInstalledSlimView>;

export const ServerRecentlyView = SelectServer.pick({
  serverId: true,
  name: true,
  username: true,
  title: true,
  avatarUrl: true,
  isClaimed: true,
  usageCount: true,
  description: true,
}).extend({
  viewId: z.string(),
});

export type ServerRecentlyView = z.infer<typeof ServerRecentlyView>;

export const UserServerView = ServerView.extend({
  owner: z.object({
    username: z.string(),
    userId: z.string(),
    name: z.string(),
    image: z.string().nullable(),
    isStaff: z.boolean(),
    isBlocked: z.boolean(),
  }),
});

export type UserServerView = z.infer<typeof UserServerView>;
