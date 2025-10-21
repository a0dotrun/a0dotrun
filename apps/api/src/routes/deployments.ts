import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import z from "zod/v4";
import { verifyBetterAuthToken } from "../middlewares/middlewares";
import { ErrorCodeEnum } from "./errors";
import { EnvsSchema, type Nothing, ServerConfigSchema } from "@a0dotrun/app/ty";
import { DeploymentTarget, TriggerTypeValue } from "@a0dotrun/app/ty";
import { parseAbsName, parseRepoUrl } from "@a0dotrun/app";
import { GitHub, Server, ServerDeployment } from "@a0dotrun/app";
import { DeployWithGitHubRequest } from "@a0dotrun/app/ty";
import { toAsyncErrorValue } from "@a0dotrun/utils";
import type { MCPServerConfigTable } from "@a0dotrun/app/db/schema";
import { a0GitHubAppID } from "@a0dotrun/app/config";

const app = new Hono();

const DeploymentRequest = z
  .object({
    name: z
      .string()
      .describe(
        "Absolute or name of the server as `username/name` or `name` format"
      ),
    repo: z.string().optional(),
    artifact: z.string().optional(),
    revisionId: z.string().optional(),
    config: z.object({
      envs: EnvsSchema.optional(),
      inputs: ServerConfigSchema.optional(),
      rootDir: z.string().optional().default("./"),
    }),
    target: z
      .enum([DeploymentTarget.PREVIEW, DeploymentTarget.PRODUCTION])
      .default(DeploymentTarget.PREVIEW),
  })
  .superRefine((data, ctx) => {
    const hasRepo = !!data.repo;
    const hasArtifact = !!data.artifact;
    const hasRevisionId = !!data.revisionId;

    const count = [hasArtifact, hasRepo, hasRevisionId].filter(Boolean).length;

    if (count === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "You must provide exactly one of: `repo`, `artifact` or `revisionId`.",
        path: [], // global error
      });
    } else if (count > 1) {
      ctx.addIssue({
        code: "custom",
        message:
          "Only one of `repo`, `artifact` or `revisionId` can be provided at a time.",
        path: [], // global error
      });
    }
  });

app.post(
  "/",
  bearerAuth({ verifyToken: verifyBetterAuthToken }),
  zValidator("json", DeploymentRequest, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            message: result.error,
            code: ErrorCodeEnum.BAD_REQUEST,
          },
        },
        400
      );
    }
  }),
  async (c) => {
    const session = c.get("user");
    const body = c.req.valid("json");

    const [partUsername, partName] = parseAbsName(session.username, body.name);
    const isOwner = partUsername === session.username;

    try {
      // Check if the owner is the one deploying the server
      // owner must own the server.
      if (isOwner) {
        const server = await Server.ownedServer({
          username: session.username,
          name: partName,
        });
        if (!server) {
          return c.json(
            {
              error: {
                message: "Server not found or does not allow deployment",
                code: ErrorCodeEnum.NOT_FOUND,
              },
            },
            404
          );
        }

        let serverConfig: MCPServerConfigTable | Nothing = null;

        // Upsert server config if provided
        // this overrides the current config
        // The assumption is that user is providing it and intends to updated the current config
        // User should be able to update it via server settings if required
        // and omit from the api if doesn't want this mutation.
        if (body.config) {
          const upsert = {
            serverId: server.serverId,
            userId: session.userId,
            envs: body.config.envs,
            config: body.config.inputs,
            rootDir: body.config.rootDir,
          };
          serverConfig = await Server.upsertConfig(upsert);
        }

        // Fetch current server config if not available
        // server config must exist for deployment required by deployment spec
        if (!serverConfig) {
          serverConfig = await Server.config(server.serverId);
          if (!serverConfig) {
            return c.json(
              {
                error: {
                  message: "Error fetching server config",
                  code: ErrorCodeEnum.INTERNAL_SERVER_ERROR,
                },
              },
              400
            );
          }
        }

        //
        // Order matters:
        //
        // Treat `repo` with highest priority,
        // next `artifact`, artifact involves uploading sources to storage,
        // least `revisionId`
        // revisionId is when you want to do a full re-deployment part without build
        //

        // Do deployment for the connected GitHub repository
        if (body.repo) {
          const [parseErr, repo] = parseRepoUrl(body.repo);
          if (parseErr || !repo) {
            return c.json(
              {
                error: {
                  message: "GitHub repo not found",
                  code: ErrorCodeEnum.NOT_FOUND,
                },
              },
              404
            );
          }

          const ghInstallation = await GitHub.userInstallation({
            userId: session.userId,
            githubAppId: a0GitHubAppID(),
            account: repo.owner,
          });
          if (!ghInstallation) {
            return c.json(
              {
                error: {
                  message: "GitHub app is not connected",
                  code: ErrorCodeEnum.FORBIDDEN,
                },
              },
              403
            );
          }

          // Fetch GitHub repo details to make sure it exists and have access
          // Some other details like commit hash is pulled for tracking
          const [repoErr, repoDetails] = await toAsyncErrorValue(() =>
            GitHub.repoDetail({
              githubInstallationId: ghInstallation.githubInstallationId,
              owner: repo.owner,
              repo: repo.repo,
            })
          );
          if (repoErr || !repoDetails) {
            return c.json(
              {
                error: {
                  message: "GitHub repo not found or not allowed",
                  code: ErrorCodeEnum.NOT_FOUND,
                },
              },
              404
            );
          }
          const [commitErr, commitHash] = await toAsyncErrorValue(() =>
            GitHub.repoLatestCommitHash({
              githubInstallationId: ghInstallation.githubInstallationId,
              owner: repo.owner,
              repo: repo.repo,
              branch: repoDetails.defaultBranch,
            })
          );
          const hash = commitErr || !commitHash ? "unknown" : commitHash;

          const newRequest: z.infer<typeof DeployWithGitHubRequest> = {
            user: {
              userId: session.userId,
              username: session.username,
              githubId: session.githubId,
              isStaff: session.isStaff,
              isBlocked: session.isBlocked,
            },
            server: {
              serverId: server.serverId,
              username: server.username,
              name: server.name,
            },
            serverConfig: {
              envs: serverConfig.envs,
              inputs: serverConfig.config,
              configRevision: serverConfig.revision,
              configHash: serverConfig.configHash,
              rootDir: serverConfig.rootDir,
            },
            target: body.target,
            triggerType: TriggerTypeValue.MANUAL,
            githubAppId: ghInstallation.githubAppId,
            githubInstallationId: ghInstallation.githubInstallationId,
            githubRepo: repoDetails.name,
            githubOwner: repoDetails.owner.login,
            githubRef: repoDetails.defaultBranch,
            commitHash: hash,
          };

          const { deploymentId, buildId, revisionId } =
            await ServerDeployment.triggerGitHubBuildDeploy(newRequest);
          return c.json(
            {
              deploymentId,
              buildId,
              revisionId,
            },
            200
          );
        } else if (body.artifact) {
          return c.json(
            {
              error: {
                message: "Not Implemented Yet",
                code: ErrorCodeEnum.BAD_REQUEST,
              },
            },
            400
          );
        } else if (body.revisionId) {
          return c.json(
            {
              error: {
                message: "Not Implemented Yet",
                code: ErrorCodeEnum.BAD_REQUEST,
              },
            },
            400
          );
        } else {
          return c.json(
            {
              error: {
                message: "Not Implemented Yet",
                code: ErrorCodeEnum.BAD_REQUEST,
              },
            },
            400
          );
        }
      } else {
        if (!body.revisionId) {
          return c.json(
            {
              error: {
                message: "Must provide `revisionId` for public deployment",
                code: ErrorCodeEnum.BAD_REQUEST,
              },
            },
            404
          );
        }
      }
    } catch (err) {
      console.error(err, "Unexpected error on deployment");
      return c.json(
        {
          error: {
            code: ErrorCodeEnum.INTERNAL_SERVER_ERROR,
            message: "Internal server error occurred",
          },
        },
        500
      );
    }
  }
);

export default app;
