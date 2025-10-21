import { Resonate } from "@resonatehq/sdk";
import type { Context } from "@resonatehq/sdk";
import type {
  GitHubSourceBuilder,
  GitHubSourceDeployer,
} from "@a0dotrun/app/infra";
import {
  CloudBuildBuild,
  CloudBuildBuildNDeploy,
  type CloudBuildLogEvent,
  type CloudBuildLogStreamOptions,
} from "@a0dotrun/app/infra/providers/gcp";

const resonate = Resonate.remote({
  group: "workers",
});

export async function gcpCBBuild(ctx: Context, args: GitHubSourceBuilder) {
  const buildId = args.build.buildId;
  const builder = await CloudBuildBuild.init();

  console.info(`[ID: ${ctx.id} Build: ${buildId}] Starting build...`);
  const result = await builder.build(args, {});
  console.info(`[Build: ${buildId}] Done build...`);
  console.info(`[Build: ${buildId}] Result: ${result}`);

  return result;
}

export async function gcpBuildNDeploy(
  ctx: Context,
  args: GitHubSourceDeployer
) {
  const deploymentId = args.deployment.deploymentId;
  const deployer = (await CloudBuildBuildNDeploy.init()) as Awaited<
    ReturnType<typeof CloudBuildBuildNDeploy.init>
  > & {
    streamLogs?: (
      options: CloudBuildLogStreamOptions
    ) => AsyncGenerator<CloudBuildLogEvent>;
  };

  console.info(`ID: ${ctx.id} [Deployment: ${deploymentId}] Starting build...`);
  const result = await deployer.deploy(args, {});

  const cbBuildID =
    (typeof result.resourceIds?.cbBuildID === "string"
      ? result.resourceIds.cbBuildID
      : undefined) ??
    (typeof result.metadata?.cbBuildID === "string"
      ? result.metadata.cbBuildID
      : undefined);

  if (!cbBuildID) {
    console.warn(
      `[Deployment: ${deploymentId}] Failed to fetch Cloud Build ID`
    );
    return result;
  }

  console.info(`[Deployment: ${deploymentId}] Status: ${result.status}`);
  console.info(
    `[Deployment: ${deploymentId}] Triggered Cloud Build with Cloud Build ID: ${cbBuildID}`
  );
  console.info(`[Deployment: ${deploymentId}] Scheduled build N Deploy...`);

  return result;
}

resonate.register(CloudBuildBuildNDeploy.id, gcpBuildNDeploy);
console.log("worker is running...");
