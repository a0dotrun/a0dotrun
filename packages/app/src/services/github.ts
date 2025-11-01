import { fn } from "@riverly/utils";
import { and, asc, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { App as GhApp } from "octokit";
import z from "zod/v4";
import { Database } from "@riverly/app/db";
import { type GitHubAccountType, gitHubInstallationTable } from "../db/schema";
import { GitHubInstallationSetup } from "../ty";
import { type ServerReadme } from "../ty";
import { env } from "../env";

let ghApp: GhApp | undefined;

function getGhApp() {
  if (!ghApp) {
    ghApp = new GhApp({
      appId: env.GITHUB_APP_ID,
      privateKey: Buffer.from(env.GITHUB_PRIVATE_KEY_BASE64, "base64").toString(
        "utf8"
      ),
    });
  }
  return ghApp;
}

export namespace GitHub {
  export async function installationDetails(githubInstallationId: number) {
    function isUserOrOrg(
      account: any
    ): account is { login: string; id: number; type: string } {
      return account && typeof account.login === "string";
    }

    const response = await getGhApp().octokit.rest.apps.getInstallation({
      installation_id: githubInstallationId,
    });

    return {
      accountId: response.data.target_id,
      accountLogin: isUserOrOrg(response.data.account)
        ? response.data.account.login
        : nanoid(), // API nuances!
      accountType: response.data.target_type,
    };
  }

  export const upsertApp = fn(
    z.object({
      userId: z.string(),
      githubInstallationId: z.number(),
      githubAppId: z.number(),
      accountId: z.number(),
      accountLogin: z.string(),
      accountType: z.string(),
      setupAction: z.string(),
    }),
    async (gh) =>
      await Database.transaction(async (tx) => {
        return tx
          .insert(gitHubInstallationTable)
          .values({
            githubInstallationId: gh.githubInstallationId,
            githubAppId: gh.githubAppId,
            accountId: gh.accountId,
            accountLogin: gh.accountLogin,
            accountType: gh.accountType as GitHubAccountType,
            userId: gh.userId,
            setupAction: gh.setupAction as GitHubInstallationSetup,
          })
          .onConflictDoUpdate({
            target: [
              gitHubInstallationTable.githubAppId,
              gitHubInstallationTable.userId,
              gitHubInstallationTable.accountLogin,
            ],
            set: {
              githubInstallationId: sql`EXCLUDED.github_installation_id`,
              accountId: sql`EXCLUDED.account_id`,
              accountType: sql`EXCLUDED.account_type`,
              setupAction: sql`EXCLUDED.setup_action`,
              updatedAt: sql`NOW()`,
            },
          })
          .returning({
            id: gitHubInstallationTable.githubInstallationId,
          })
          .execute()
          .then((row) => row[0]?.id);
      })
  );

  export const userInstallation = fn(
    z.object({
      userId: z.string(),
      githubAppId: z.number(),
      account: z.string(),
    }),
    async (filter) => {
      return await Database.use(async (db) => {
        const res = await db
          .select({
            githubInstallationId: gitHubInstallationTable.githubInstallationId,
            githubAppId: gitHubInstallationTable.githubAppId,
            accountLogin: gitHubInstallationTable.accountLogin,
            accountType: gitHubInstallationTable.accountType,
            setupAction: gitHubInstallationTable.setupAction,
            createdAt: gitHubInstallationTable.createdAt,
            updatedAt: gitHubInstallationTable.updatedAt,
          })
          .from(gitHubInstallationTable)
          .where(
            and(
              eq(gitHubInstallationTable.githubAppId, filter.githubAppId),
              eq(gitHubInstallationTable.userId, filter.userId),
              eq(gitHubInstallationTable.accountLogin, filter.account)
            )
          )
          .execute()
          .then((rows) => rows.at(0));
        return res ?? undefined;
      });
    }
  );

  export const userInstalls = fn(
    z.object({ userId: z.string(), githubAppId: z.number() }),
    async (filter) =>
      await Database.use(async (db) =>
        db
          .select({
            githubInstallationId: gitHubInstallationTable.githubInstallationId,
            githubAppId: gitHubInstallationTable.githubAppId,
            accountLogin: gitHubInstallationTable.accountLogin,
            accountType: gitHubInstallationTable.accountType,
            setupAction: gitHubInstallationTable.setupAction,
            createdAt: gitHubInstallationTable.createdAt,
            updatedAt: gitHubInstallationTable.updatedAt,
          })
          .from(gitHubInstallationTable)
          .where(
            and(
              eq(gitHubInstallationTable.githubAppId, filter.githubAppId),
              eq(gitHubInstallationTable.userId, filter.userId)
            )
          )
          .orderBy(asc(gitHubInstallationTable.createdAt))
          .limit(25)
      )
  );

  export const repos = fn(z.number(), async (githubInstallationId) => {
    const octokit = await getGhApp().getInstallationOctokit(
      githubInstallationId
    );
    const repos = await octokit.paginate(
      octokit.rest.apps.listReposAccessibleToInstallation,
      {
        installation_id: githubInstallationId,
        per_page: 100,
      }
    );
    return repos.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name, // e.g. "sanchitrk/foobar"
      private: r.private,
      defaultBranch: r.default_branch,
      htmlUrl: r.html_url,
      cloneUrl: r.clone_url,
      permissions: r.permissions,
      owner: r.owner.login,
    }));
  });

  export const repoDetail = fn(
    z.object({
      githubInstallationId: z.number(),
      owner: z.string(),
      repo: z.string(),
    }),
    async (q) => {
      const octokit = await getGhApp().getInstallationOctokit(
        q.githubInstallationId
      );
      const { data } = await octokit.rest.repos.get({
        owner: q.owner,
        repo: q.repo,
      });
      const { owner } = data;
      return {
        id: data.id,
        name: data.name,
        fullName: data.full_name,
        private: data.private,
        defaultBranch: data.default_branch,
        htmlUrl: data.html_url,
        cloneUrl: data.clone_url,
        permissions: data.permissions,
        license: data.license,
        owner,
      };
    }
  );

  export const repoReadme = fn(
    z.object({
      githubInstallationId: z.number(),
      username: z.string(),
      name: z.string(),
    }),
    async (repo) => {
      const octokit = await getGhApp().getInstallationOctokit(
        repo.githubInstallationId
      );
      const { data } = await octokit.rest.repos.getReadme({
        owner: repo.username,
        repo: repo.name,
      });
      return {
        sha: data.sha,
        gitHtmlUrl: data.html_url ?? undefined,
        gitUrl: data.git_url ?? undefined,
        gitDownloadUrl: data.download_url ?? undefined,
      } as ServerReadme;
    }
  );

  export const repoLatestCommitHash = fn(
    z.object({
      githubInstallationId: z.number(),
      owner: z.string(),
      repo: z.string(),
      branch: z.string(),
    }),
    async (r) => {
      const octokit = await getGhApp().getInstallationOctokit(
        r.githubInstallationId
      );

      const { data } = await octokit.rest.git.getRef({
        owner: r.owner,
        repo: r.repo,
        ref: `heads/${r.branch}`,
      });
      return data.object.sha;
    }
  );

  export type UserInstalls = Awaited<ReturnType<typeof userInstalls>>;
}
