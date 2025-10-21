import { Builder } from "../builder";
import { Deployer } from "../deployer";
import { GitHubSourceBuilder, GitHubSourceDeployer } from "../../ty";
import { gcpCloudBuildConfigSchema, gcpConfigSchema } from "./config";
import { CloudBuildClient, protos } from "@google-cloud/cloudbuild";
import { NamedError } from "@a0dotrun/utils";
import type { Logger } from "@a0dotrun/utils";
import z from "zod/v4";
import { CloudBuildStatus, CloudBuildStatusEnum } from "./ty";
import { Buffer } from "node:buffer";
import { DeploymentStatusEnum } from "../../../ty";

const CloudBuildTriggerError = NamedError.create(
  "CloudBuildTriggerError",
  z.object({
    message: z.string(),
  })
);

export type CloudBuildLogStreamOptions = {
  buildId: string;
  stepName?: string;
  pollIntervalMs?: number;
  timeoutMs?: number;
};

export type CloudBuildLogEvent =
  | {
      type: "log";
      message: string;
      stepName?: string;
      severity?: string;
      timestamp?: Date;
      logId?: string;
    }
  | {
      type: "status";
      status: CloudBuildStatus;
    }
  | {
      type: "timeout";
    };

export const CloudBuildBuild = Builder.define("gcp_cb_build", {
  parameters: GitHubSourceBuilder,
  async build(params, ctx) {
    ctx.logger.info("Starting GCP Cloud Build...");
    ctx.logger.info(ctx);
    ctx.logger.info(params);
    return {
      status: "success" as const,
      taskId: "jobId-123",
      image: "https:image.mcp.net",
      metadata: {},
    };
  },
});

export const CloudBuildBuildNDeploy = Deployer.define(
  "gcp_cb_build_n_deploy",
  async () => ({
    parameters: GitHubSourceDeployer,
    async deploy(params, ctx): Promise<Deployer.Result> {
      const logger: Logger = ctx.logger;
      logger.info(
        {
          deploymentId: params.deployment.deploymentId,
          buildId: params.build.buildId,
          target: params.deployment.target,
        },
        "Starting GCP Cloud Build deploy..."
      );

      const gcpConfig = gcpConfigSchema.parse({});
      const gcpBuildConfig = gcpCloudBuildConfigSchema.parse({});

      const imageName = buildArtifactPath(gcpConfig, params);
      const repoUrl = `https://github.com/${params.githubOrg}/${params.githubRepo}.git`;
      // const callbackBaseUrl = resolveCallbackBaseUrl();
      // const callbackUrl = `${callbackBaseUrl}/__/v1/deployments/callback`;
      // const deploymentLogDrainUrl = `${callbackBaseUrl}/__/v1/deployments/log`;
      const serviceName = buildServiceName(params.deployment.deploymentId);
      const dockerBuildTimeoutSeconds = parseDurationSeconds(
        gcpBuildConfig.dockerBuildTimeout
      );

      // const jwt = await issueM2MServiceToken(params.user.userId);

      const buildDefinition: protos.google.devtools.cloudbuild.v1.IBuild = {
        tags: [
          `deployment-id-${params.deployment.deploymentId.toLowerCase()}` as const,
          `build-id-${params.build.buildId.toLowerCase()}` as const,
          `user-id-${params.user.userId.toLowerCase()}` as const,
          `deployment-target-${params.deployment.target.toLowerCase()}` as const,
          `ty-build-n-deploy` as const,
        ],
        timeout: { seconds: gcpBuildConfig.maxTimeoutSeconds },
        images: [imageName],
        substitutions: {
          // _DEPLOYMENT_ID: params.deployment.deploymentId,
          // _BUILD_ID: params.build.buildId,
          _REPO_URL: repoUrl,
          _BRANCH: params.githubRef,
          _IMAGE_NAME: imageName,
          _GITHUB_APP_ID: params.githubAppId.toString(),
          _GITHUB_INSTALLATION_ID: params.githubInstallationId.toString(),
          // _SERVICE_JWT: jwt,
          // _CALLBACK_URL: callbackUrl,
          // _LOG_DRAIN_URL: deploymentLogDrainUrl,
          // _EVENT_TYPE: DeployEventActionEnum.BUILD_N_DEPLOY,
          _SERVICE_NAME: serviceName,
          _REGION: gcpConfig.GCP_REGION,
        },
        options: {
          logging: "CLOUD_LOGGING_ONLY",
        },
        steps: [
          {
            name: "gcr.io/cloud-builders/gcloud",
            id: "FETCH_SECRET",
            entrypoint: "bash",
            args: ["-c", fetchSecretScript(gcpConfig)],
          },
          {
            name: "gcr.io/a0run-001/cbuilder-gcloud",
            id: "GENERATE_GITHUB_TOKEN",
            entrypoint: "cbuilder",
            env: [
              "_GITHUB_APP_ID=$_GITHUB_APP_ID",
              "_GITHUB_INSTALLATION_ID=$_GITHUB_INSTALLATION_ID",
            ],
            args: [
              "github",
              "--app",
              "$_GITHUB_APP_ID",
              "--install",
              "$_GITHUB_INSTALLATION_ID",
              "--pem",
              "/workspace/github-private-key.pem",
              "--o",
              "/workspace/github-auth-token.txt",
            ],
          },
          {
            name: "gcr.io/cloud-builders/git",
            id: "PUBLIC_CLONE_REPOSITORY",
            entrypoint: "bash",
            timeout: { seconds: 300 },
            args: ["-c", cloneRepoScript()],
          },
          {
            name: "gcr.io/cloud-builders/docker",
            id: "PUBLIC_BUILD_IMAGE",
            env: ["DOCKER_BUILDKIT=1"],
            timeout: {
              seconds: dockerBuildTimeoutSeconds,
            },
            args: ["build", "-t", "$_IMAGE_NAME", "/workspace/source"],
          },
          {
            name: "gcr.io/cloud-builders/docker",
            id: "PUSH_IMAGE",
            timeout: { seconds: 600 },
            args: ["push", "$_IMAGE_NAME"],
          },
          {
            name: "gcr.io/google.com/cloudsdktool/cloud-sdk:slim",
            id: "DEPLOY_CLOUD_RUN",
            entrypoint: "gcloud",
            timeout: { seconds: 300 },
            args: [
              "run",
              "deploy",
              "$_SERVICE_NAME",
              "--image",
              "$_IMAGE_NAME",
              "--region",
              "$_REGION",
              "--platform",
              "managed",
              "--allow-unauthenticated",
              "--max-instances",
              "1",
              "--memory",
              "512Mi",
            ],
          },
          // {
          //   name: "gcr.io/cloud-builders/gcloud",
          //   id: "Get Image Digest",
          //   entrypoint: "bash",
          //   args: ["-c", getImageDigestScript()],
          // },
          // {
          //   name: "gcr.io/a0run-001/cbuilder-gcloud",
          //   id: "Send Callback",
          //   entrypoint: "bash",
          //   args: ["-c", sendCallbackScript()],
          // },
        ],
      };

      if (ctx.dryRun) {
        logger.info(
          {
            imageName,
            repoUrl,
            substitutions: buildDefinition.substitutions,
          },
          "Dry run: skipping Cloud Build submission"
        );
        return {
          status: "dry_run" as const,
          message: "Dry run enabled; Cloud Build job not submitted.",
          metadata: {
            imageName,
            buildDefinition,
          },
        };
      }

      const cloudBuildClient = new CloudBuildClient();

      try {
        const [operation] = await cloudBuildClient.createBuild({
          projectId: gcpConfig.GCP_PROJECT_ID,
          build: buildDefinition,
        });

        const operationName = operation.name ?? operation.latestResponse?.name;
        const metadata = operation.latestResponse?.metadata as
          | protos.google.devtools.cloudbuild.v1.IBuildOperationMetadata
          | undefined;

        const cbBuildID = normalizeBuildIdCandidate(
          metadata?.build?.id,
          metadata?.build?.name,
          operationName
        );

        const cbBuildStatus = normalizeBuildStatus(metadata?.build?.status);

        if (!operationName) {
          return {
            status: DeploymentStatusEnum.ERROR,
            message: "Failed with `no operation result`",
          };
        }

        logger.info(
          { operationName, cbBuildStatus: cbBuildStatus, cbBuildID: cbBuildID },
          "Submitted Cloud Build; not monitoring (fire-and-forget)."
        );

        return {
          status: DeploymentStatusEnum.PLACED,
          message: `Cloud Build submitted. Operation: ${operationName}, initial status: ${cbBuildStatus}`,
          resourceIds: {
            operationName,
            ...(cbBuildID ? { cbBuildID: cbBuildID } : {}),
          },
          metadata: {
            imageName,
            buildStatus: cbBuildStatus,
            ...(cbBuildID ? { cbBuildID: cbBuildID } : {}),
          },
        };
      } catch (error: unknown) {
        const err = toError(error);
        logger.error({ err }, "Failed to submit GCP Cloud Build deployment");
        throw new CloudBuildTriggerError({ message: err.message });
      } finally {
        await cloudBuildClient.close().catch(() => undefined);
      }
    },
  })
);

function fetchSecretScript(gcpConfig: z.infer<typeof gcpConfigSchema>): string {
  return [
    "set -euo pipefail",
    'echo "🔐 Fetching GitHub secret key..."',
    `gcloud secrets versions access latest --secret="${gcpConfig.GH_SECRET_KEY}" > /workspace/github-private-key.pem`,
    "chmod 600 /workspace/github-private-key.pem",
    'echo "✅ Secret key fetched."',
  ].join("\n");
}

function cloneRepoScript(): string {
  return [
    "set -euo pipefail",
    'echo "📥 Configuring git and cloning repository..."',
    "",
    "GITHUB_TOKEN=$$(cat /workspace/github-auth-token.txt)",
    "git config --global credential.helper 'store'",
    "# Use $$ without curly braces to survive Cloud Build substitution",
    'echo "https://x-access-token:$$GITHUB_TOKEN@github.com" > ~/.git-credentials',
    "",
    'git clone --depth 1 --branch "$_BRANCH" "$_REPO_URL" /workspace/source',
    'echo "✅ Repository cloned successfully."',
  ].join("\n");
}

// function getImageDigestScript(): string {
//   return [
//     "set -euo pipefail",
//     'gcloud artifacts docker images describe "$_IMAGE_NAME" \\',
//     "  --format='get(image_summary.digest)' > /workspace/digest.txt",
//   ].join("\n");
// }

// function sendCallbackScript(): string {
//   return [
//     "set -x",
//     "",
//     "DIGEST=$$(cat /workspace/digest.txt)",
//     'BUILT_AT=$$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")',
//     "",
//     "cat <<EOF > /workspace/payload.json",
//     "{",
//     '  "imageRef": "$_IMAGE_NAME",',
//     '  "imageDigest": "$$DIGEST",',
//     '  "deploymentId": "$_DEPLOYMENT_ID",',
//     '  "buildId": "$_BUILD_ID",',
//     '  "builtAt": "$$BUILT_AT",',
//     '  "event": "$_EVENT_TYPE",',
//     '  "status": "ready"',
//     "}",
//     "EOF",
//     "",
//     "echo",
//     "",
//     'cbuilder callback "$_CALLBACK_URL" \\',
//     '  -H "Content-Type: application/json" \\',
//     '  -H "Authorization: Bearer $_SERVICE_JWT" \\',
//     "  -d @/workspace/payload.json",
//   ].join("\n");
// }

function normalizeBuildIdCandidate(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeBuildId(candidate);
    if (normalized) return normalized;
  }
  return null;
}

function normalizeBuildId(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const segment = trimmed.includes("/")
    ? (trimmed.split("/").filter(Boolean).pop() ?? trimmed)
    : trimmed;

  if (looksLikeUuid(segment)) {
    return segment.toLowerCase();
  }

  if (looksLikeBase64(segment)) {
    try {
      const normalizedSegment = segment.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = Buffer.from(normalizedSegment, "base64")
        .toString("utf8")
        .trim();
      if (decoded && decoded !== segment && isPrintableAscii(decoded)) {
        const normalizedDecoded = normalizeBuildId(decoded);
        if (normalizedDecoded) return normalizedDecoded;
      }
    } catch {
      // ignore decode failures
    }
  }

  return segment;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function looksLikeBase64(value: string): boolean {
  if (value.length < 16 || value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/_-]+={0,2}$/.test(value);
}

function isPrintableAscii(value: string): boolean {
  return /^[\x20-\x7E]+$/.test(value);
}

function normalizeEntryData(
  data: unknown
): Record<string, unknown> | string | undefined {
  if (data === undefined || data === null) return undefined;
  if (typeof data === "string") return data;
  if (Array.isArray(data)) return { data };
  if (typeof data !== "object") return String(data);

  if ("fields" in (data as Record<string, unknown>)) {
    const fields = (data as { fields?: Record<string, unknown> }).fields;
    if (fields && typeof fields === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        result[key] = extractStructValue(value);
      }
      return result;
    }
  }

  return data as Record<string, unknown>;
}

function extractStructValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;

  const candidate = value as {
    stringValue?: unknown;
    numberValue?: unknown;
    boolValue?: unknown;
    structValue?: unknown;
    listValue?: { values?: unknown[] };
  };

  if ("stringValue" in candidate && candidate.stringValue !== undefined) {
    return candidate.stringValue;
  }
  if ("numberValue" in candidate && candidate.numberValue !== undefined) {
    return candidate.numberValue;
  }
  if ("boolValue" in candidate && candidate.boolValue !== undefined) {
    return candidate.boolValue;
  }
  if ("structValue" in candidate && candidate.structValue !== undefined) {
    return normalizeEntryData(candidate.structValue);
  }
  if ("listValue" in candidate && candidate.listValue?.values) {
    return candidate.listValue.values.map((entry) => extractStructValue(entry));
  }

  return value;
}

function normalizeBuildStatus(
  status?:
    | protos.google.devtools.cloudbuild.v1.Build.Status
    | keyof typeof protos.google.devtools.cloudbuild.v1.Build.Status
    | null
): CloudBuildStatus {
  if (status === null || status === undefined) {
    return CloudBuildStatusEnum.STATUS_UNKNOWN;
  }

  if (typeof status === "string") {
    const normalized = status.toUpperCase();
    if (normalized in CloudBuildStatusEnum) {
      return normalized as CloudBuildStatus;
    }
    return CloudBuildStatusEnum.STATUS_UNKNOWN;
  }

  const name = protos.google.devtools.cloudbuild.v1.Build.Status[
    status
  ] as keyof typeof protos.google.devtools.cloudbuild.v1.Build.Status;

  if (name && name in CloudBuildStatusEnum) {
    return name as CloudBuildStatus;
  }

  return CloudBuildStatusEnum.STATUS_UNKNOWN;
}

function buildArtifactPath(
  config: z.infer<typeof gcpConfigSchema>,
  params: z.infer<typeof GitHubSourceDeployer>
): string {
  const regionPrefix = `${config.GCP_REGION}-docker.pkg.dev`;
  const repository = "a0dotrun-paas-images";
  const userSegment = params.user.userId.toLowerCase();
  const serverSegment = params.server.serverId.toLowerCase();
  const tag = params.build.buildId.toLowerCase();
  return `${regionPrefix}/${config.GCP_PROJECT_ID}/${repository}/${userSegment}/servers/${serverSegment}:${tag}`;
}

function buildServiceName(deploymentId: string): string {
  const prefixed = `srv${deploymentId.toLowerCase()}`;
  return prefixed.slice(0, 63).replace(/-+$/, "");
}

function parseDurationSeconds(value: string): number {
  const match = value.match(/^(\d+)(s)$/i);
  if (!match) return 600;
  return Number.parseInt(match[1] as string, 10);
}

function toError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(String(error));
}
