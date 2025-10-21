import { and, desc, eq, or } from "drizzle-orm";
import z from "zod/v4";
import { db } from "../db";
import {
  buildTable,
  InsertDeploymentLog,
  InsertDeployment,
  InsertRevision,
  deploymentLogTable,
  deploymentTable,
  GitHubInsertBuild,
  revisionTable,
  serverInstallTable,
  serverTable,
  UpdateBuild,
  UpdateDeployment,
} from "../db/schema";
import {
  DeploymentStatusType,
  DeploymentTargetType,
  RevisionStatusValue,
  TriggerTypeValue,
  DeploymentStatusEnum,
  DeploymentTarget,
  DeployWithGitHubRequest,
} from "../ty";
import { UpdateBuildDeploy } from "../db/schema";
import { GitHubSourceDeployer } from "../infra/ty";
import { fn, NamedError } from "@a0dotrun/utils";
import { getResonateClient } from "../lib/rsc";
import { CloudBuildBuildNDeploy } from "../infra/providers/gcp";

const rsc = getResonateClient();

export const ServerInstallError = NamedError.create(
  "ServerInstallError",
  z.object({
    message: z.string(),
  })
);

export const BuildInsertError = NamedError.create(
  "BuildInsertError",
  z.object({
    message: z.string(),
  })
);

export const DeployInsertError = NamedError.create(
  "DeployInsertError",
  z.object({
    message: z.string(),
  })
);

export const RevisionInsertError = NamedError.create(
  "RevisionInsertError",
  z.object({
    message: z.string(),
  })
);

export const DeployJobRequestError = NamedError.create(
  "DeployJobRequestError",
  z.object({
    message: z.string(),
  })
);

// type DBTx = PgTransaction<
//   NodePgQueryResultHKT,
//   Record<string, never>,
//   ExtractTablesWithRelations<Record<string, never>>
// >;

export namespace ServerDeployment {
  export const deployments = fn(
    z.object({
      userId: z.string(),
      target: z.enum([
        DeploymentTarget.DEVELOPMENT,
        DeploymentTarget.PREVIEW,
        DeploymentTarget.PRODUCTION,
        "all",
      ]),
      limit: z.number(),
    }),
    async (filter) => {
      const condition =
        filter.target === "all"
          ? or(
              eq(deploymentTable.target, DeploymentTarget.PREVIEW),
              eq(deploymentTable.target, DeploymentTarget.PRODUCTION)
            )
          : eq(deploymentTable.target, filter.target as DeploymentTargetType);

      return db
        .select({
          deploymentId: deploymentTable.deploymentId,
          username: serverTable.username,
          name: serverTable.name,
          title: serverTable.title,
          avatarUrl: serverTable.avatarUrl,
          status: deploymentTable.status,
          imageDigest: buildTable.imageDigest,
          buildId: buildTable.buildId,
          createdAt: deploymentTable.createdAt,
        })
        .from(deploymentTable)
        .innerJoin(
          serverTable,
          eq(deploymentTable.serverId, serverTable.serverId)
        )
        .innerJoin(buildTable, eq(deploymentTable.buildId, buildTable.buildId))
        .where(and(eq(deploymentTable.userId, filter.userId), condition))
        .orderBy(desc(deploymentTable.createdAt))
        .limit(filter.limit);
    }
  );

  export const userDeployment = fn(
    z.object({
      userId: z.string(),
      deploymentId: z.string(),
    }),
    async (filter) => {
      return db
        .select({
          deploymentId: deploymentTable.deploymentId,
          username: serverTable.username,
          name: serverTable.name,
          title: serverTable.title,
          avatarUrl: serverTable.avatarUrl,
          status: deploymentTable.status,
          imageDigest: buildTable.imageDigest,
          buildId: buildTable.buildId,
          createdAt: deploymentTable.createdAt,
          githubRepo: buildTable.gitHubRepo,
          gitHubRef: buildTable.gitHubRef,
          githubOrg: buildTable.githubOwner,
          commitHash: buildTable.commitHash,
          target: deploymentTable.target,
        })
        .from(deploymentTable)
        .innerJoin(
          serverTable,
          eq(deploymentTable.serverId, serverTable.serverId)
        )
        .innerJoin(buildTable, eq(deploymentTable.buildId, buildTable.buildId))
        .where(
          and(
            eq(deploymentTable.userId, filter.userId),
            eq(deploymentTable.deploymentId, filter.deploymentId)
          )
        )
        .execute()
        .then((row) => row[0]);
    }
  );

  export const serverDeployments = fn(
    z.object({
      userId: z.string(),
      serverId: z.string(),
      target: z.enum([
        DeploymentTarget.DEVELOPMENT,
        DeploymentTarget.PREVIEW,
        DeploymentTarget.PRODUCTION,
        "all",
      ]),
      limit: z.number(),
    }),
    async (filter) => {
      const condition =
        filter.target === "all"
          ? or(
              eq(deploymentTable.target, DeploymentTarget.PREVIEW),
              eq(deploymentTable.target, DeploymentTarget.PRODUCTION)
            )
          : eq(deploymentTable.target, filter.target as DeploymentTargetType);

      return db
        .select({
          deploymentId: deploymentTable.deploymentId,
          username: serverTable.username,
          name: serverTable.name,
          title: serverTable.title,
          avatarUrl: serverTable.avatarUrl,
          status: deploymentTable.status,
          imageDigest: buildTable.imageDigest,
          buildId: buildTable.buildId,
          createdAt: deploymentTable.createdAt,
        })
        .from(deploymentTable)
        .innerJoin(
          serverTable,
          eq(deploymentTable.serverId, serverTable.serverId)
        )
        .innerJoin(buildTable, eq(deploymentTable.buildId, buildTable.buildId))
        .where(
          and(
            eq(deploymentTable.userId, filter.userId),
            eq(deploymentTable.serverId, filter.serverId),
            condition
          )
        )
        .orderBy(desc(deploymentTable.createdAt))
        .limit(filter.limit);
    }
  );

  export const triggerGitHubBuildDeploy = fn(
    DeployWithGitHubRequest,
    async (deploy) => {
      return db.transaction(async (tx) => {
        const installedServer = await tx
          .select()
          .from(serverInstallTable)
          .where(
            and(
              eq(serverInstallTable.userId, deploy.user.userId),
              eq(serverInstallTable.serverId, deploy.server.serverId)
            )
          )
          .execute()
          .then((row) => row[0]);

        if (!installedServer)
          throw new DeployInsertError({
            message: "Failed to fetch installed server",
          });

        const newGitHubBuild: z.infer<typeof GitHubInsertBuild> = {
          serverId: deploy.server.serverId,
          userId: deploy.user.userId,
          gitHubRepo: deploy.githubRepo,
          gitHubRef: deploy.githubRef,
          githubOwner: deploy.githubOwner,
          commitHash: deploy.commitHash,
          status: DeploymentStatusEnum.PLACED,
          configRevision: deploy.serverConfig.configRevision,
          configHash: deploy.serverConfig.configHash,
          envs: deploy.serverConfig.envs,
          config: deploy.serverConfig.inputs,
          rootDir: deploy.serverConfig.rootDir,
          triggerType: TriggerTypeValue.MANUAL,
        };

        const newBuildParsed = GitHubInsertBuild.safeParse(newGitHubBuild);
        if (!newBuildParsed.success) {
          throw new BuildInsertError({
            message: "Failed to validate GitHub build insert schema",
          });
        }

        const newBuild = await tx
          .insert(buildTable)
          .values(newBuildParsed.data)
          .returning()
          .execute()
          .then((row) => row[0]);

        if (!newBuild)
          throw new BuildInsertError({
            message: "Failed to insert GitHub build",
          });

        const newGitHubDeployment: z.infer<typeof InsertDeployment> = {
          buildId: newBuild.buildId,
          serverId: newBuild.serverId,
          userId: newBuild.userId,
          installId: installedServer.installId,
          status: DeploymentStatusEnum.PLACED, // build + deploy is atomic having same status.
          target: deploy.target,
        };
        const newDeploymentParsed =
          InsertDeployment.safeParse(newGitHubDeployment);
        if (!newDeploymentParsed.success) {
          throw new DeployInsertError({
            message: "Failed to validate deployment insert schema",
          });
        }

        const deployment = await tx
          .insert(deploymentTable)
          .values(newDeploymentParsed.data)
          .returning()
          .execute()
          .then((row) => row[0]);

        if (!deployment)
          throw new DeployInsertError({
            message: "Failed to insert deployment",
          });

        const newRevision: z.infer<typeof InsertRevision> = {
          buildId: newBuild.buildId,
          deploymentId: deployment.deploymentId,
          serverId: deployment.serverId,
          ownerId: deployment.userId,
          status: RevisionStatusValue.DRAFT,
        };
        const newRevisionParsed = InsertRevision.safeParse(newRevision);
        if (!newRevisionParsed.success)
          throw new RevisionInsertError({
            message: "Failed to validate insert revision schema",
          });

        const revision = await tx
          .insert(revisionTable)
          .values(newRevisionParsed.data)
          .returning()
          .execute()
          .then((row) => row[0]);

        if (!revision)
          throw new RevisionInsertError({
            message: "Failed to insert revision",
          });

        const requestDeployer: z.infer<typeof GitHubSourceDeployer> = {
          user: {
            userId: deploy.user.userId,
            username: deploy.user.username,
            githubId: deploy.user.githubId,
            isStaff: deploy.user.isStaff,
            isBlocked: deploy.user.isBlocked,
          },
          server: {
            serverId: deploy.server.serverId,
            username: deploy.server.username,
            name: deploy.server.name,
          },
          githubRepo: deploy.githubRepo,
          githubOrg: deploy.githubOwner,
          githubRef: deploy.githubRef,
          githubAppId: deploy.githubAppId,
          githubInstallationId: deploy.githubInstallationId,
          commitHash: deploy.commitHash,
          build: {
            buildId: newBuild.buildId,
            envs: deploy.serverConfig.envs,
            inputs: deploy.serverConfig.inputs,
            configRevision: deploy.serverConfig.configRevision,
            configHash: deploy.serverConfig.configHash,
            rootDir: deploy.serverConfig.rootDir,
          },
          deployment: {
            deploymentId: deployment.deploymentId,
            target: deployment.target,
            publicId: deployment.target,
          },
        };

        const requestParsed = GitHubSourceDeployer.safeParse(requestDeployer);
        if (!requestParsed.success)
          throw new DeployJobRequestError({
            message: "Failed to validate deploy job request schema",
          });

        //
        // Pass the parsed data to the RPC invoke worker
        // The worker should share the same data type payload.
        // const workflowClient = rsc.workflowClient<GCPCBBuildDeployWrkFlow>(
        //   { name: CloudBuildBuildNDeploy.id },
        //   deployment.deploymentId
        // );
        // const response = await workflowClient.workflowSubmit({
        //   ...requestParsed.data,
        // });
        // if (response.status != "Accepted") {
        //   throw new DeployJobRequestError({
        //     message: "Failed to submit job, deployment already exists.",
        //   });
        // }
        //

        await rsc.beginRpc(
          deployment.deploymentId,
          CloudBuildBuildNDeploy.id,
          { ...requestParsed.data },
          rsc.options({
            target: "poll://any@workers",
          })
        );

        return {
          deploymentId: deployment.deploymentId,
          buildId: newBuild.buildId,
          revisionId: revision.revisionId,
        };
      });
    }
  );

  export const updateBuildDeploy = fn(
    UpdateBuildDeploy.extend({ buildId: z.string(), deploymentId: z.string() }),
    async (updates) => {
      return db.transaction(async (tx) => {
        await tx
          .update(buildTable)
          .set({
            imageRef: updates.build.imageRef,
            imageDigest: updates.build.imageDigest,
            builtAt: updates.build.builtAt,
            status: updates.build.status,
          })
          .where(eq(buildTable.buildId, updates.buildId))
          .returning()
          .execute()
          .then((row) => row[0]);

        await tx
          .update(deploymentTable)
          .set({
            status: updates.deployment.status,
          })
          .where(eq(deploymentTable.deploymentId, updates.deploymentId))
          .returning()
          .execute()
          .then((row) => row[0]);
      });
    }
  );

  export const updateBuild = fn(
    UpdateBuild.extend({ buildId: z.string() }),
    async (updates) => {
      return db.transaction(async (tx) => {
        await tx
          .update(buildTable)
          .set({
            imageRef: updates.imageRef,
            imageDigest: updates.imageDigest,
            builtAt: updates.builtAt,
            status: updates.status,
          })
          .where(eq(buildTable.buildId, updates.buildId))
          .returning()
          .execute()
          .then((row) => row[0]);
      });
    }
  );

  export const updateDeploy = fn(
    UpdateDeployment.extend({ deploymentId: z.string() }),
    async (updates) => {
      return db.transaction(async (tx) => {
        await tx
          .update(deploymentTable)
          .set({
            status: updates.status,
          })
          .where(eq(deploymentTable.deploymentId, updates.deploymentId))
          .returning()
          .execute()
          .then((row) => row[0]);
      });
    }
  );

  export const ingestLog = fn(
    InsertDeploymentLog,
    async (log) =>
      await db
        .insert(deploymentLogTable)
        .values(log)
        .onConflictDoUpdate({
          target: deploymentLogTable.logId,
          set: {
            message: log.message,
            timestamp: log.timestamp,
            level: log.level,
          },
        })
        .returning({ logId: deploymentLogTable.logId })
        .execute()
        .then((row) => row[0])
  );
}

export type DeploymentPreview = {
  deploymentId: string;
  username: string;
  name: string;
  title: string;
  avatarUrl: string | null;
  status: DeploymentStatusType;
  imageDigest: string | null;
  buildId: string;
  createdAt: Date;
};

// export namespace GCPCloudBuild {
//   export const appendBuildLog = fn(
//     z.object({
//       gcpBuildId: z.string(),
//       buidlId: z.string(),
//       deploymentId: z.string(),
//       userId: z.string(),
//       status: CloudBuildStatus,
//     }),
//     async () => {}
//   );
// }
