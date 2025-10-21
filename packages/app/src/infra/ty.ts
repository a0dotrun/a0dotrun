import z from "zod/v4";

// Represents the schema for GitHub linked source build
// Mandatory fields:
// `user` for whom deploying the server
// `server` the actual server being deployed for the user
export const GitHubSourceBuilder = z.object({
  user: z
    .object({
      userId: z.string(),
      username: z.string(),
      githubId: z.string(),
      isStaff: z.boolean(),
      isBlocked: z.boolean(),
    })
    .required(),
  server: z
    .object({
      serverId: z.string(),
      username: z.string(),
      name: z.string(),
    })
    .required(),
  githubRepo: z.string(),
  githubOrg: z.string(),
  githubRef: z.string(),
  commitHash: z.string(),
  githubAppId: z.number(),
  githubInstallationId: z.number(),
  build: z
    .object({
      buildId: z.string(),
      envs: z
        .array(
          z
            .object({
              name: z.string(),
              value: z.string(),
              secret: z.boolean().optional().default(false),
            })
            .required()
        )
        .default([]),
      inputs: z.record(z.string(), z.any()).optional(),
      configRevision: z.string(),
      configHash: z.string(),
      rootDir: z.string().default("./"),
    })
    .required(),
});

export type GitHubSourceBuilder = z.infer<typeof GitHubSourceBuilder>;

export const GitHubSourceDeployer = GitHubSourceBuilder.extend({
  deployment: z
    .object({
      deploymentId: z.string(),
      target: z.string(),
      publicId: z.string(),
    })
    .required(),
});

export type GitHubSourceDeployer = z.infer<typeof GitHubSourceDeployer>;

// export const DeployEventActionEnum = {
//   BUILD_N_DEPLOY: "build_n_deploy",
//   BUILD: "build",
//   DEPLOY: "deploy",
// } as const;

// export const DeployEventAction = z.enum([
//   DeployEventActionEnum.BUILD_N_DEPLOY,
//   DeployEventActionEnum.BUILD,
//   DeployEventActionEnum.DEPLOY,
// ]);

// export type DeployEventAction = z.infer<typeof DeployEventAction>;
