import * as fs from "node:fs";
import * as path from "node:path";

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as gcfv2 from "@pulumi/gcp/cloudfunctionsv2";

type TypeScript = typeof import("typescript");

const config = new pulumi.Config();

const project = gcp.config.project ?? config.get("project");
if (!project) {
  throw new Error(
    "GCP project must be configured via Pulumi config or provider configuration."
  );
}

const region =
  config.get("region") ??
  gcp.config.region ??
  gcp.config.zone?.replace(/-[a-z]$/, "") ??
  "us-central1";

const functionName = config.get("functionName") ?? "cloudbuild-event-forwarder";
const targetWebhook =
  config.get("targetWebhook") ??
  "https://localapi.riverly.tech/__/v1/deployments/gcp/events";
const targetWebhookUsername = config.get("targetWebhookUsername") ?? "a0runner";
const targetWebhookPasswordFromConfig = config.getSecret(
  "targetWebhookPassword"
);
const targetWebhookPasswordEnv = process.env.TARGET_DEPLOYMENT_WEBHOOK_PASSWORD;

if (!targetWebhookPasswordFromConfig && !targetWebhookPasswordEnv) {
  throw new Error(
    "Missing deployment webhook credentials. Set Pulumi config 'cloudbuild:targetWebhookPassword' (preferably with --secret) or export TARGET_DEPLOYMENT_WEBHOOK_PASSWORD."
  );
}

const targetWebhookPassword =
  targetWebhookPasswordFromConfig ?? pulumi.secret(targetWebhookPasswordEnv!);
const cloudBuildTopicName = config.get("cloudBuildTopic") ?? "cloud-builds";

const requiredServices = [
  "artifactregistry.googleapis.com",
  "cloudbuild.googleapis.com",
  "cloudfunctions.googleapis.com",
  "compute.googleapis.com",
  "eventarc.googleapis.com",
  "pubsub.googleapis.com",
  "run.googleapis.com",
  "storage.googleapis.com",
] as const;

const enabledServices = requiredServices.map(
  (service) =>
    new gcp.projects.Service(
      service.replace(".googleapis.com", "").replace(/\./g, "-"),
      {
        project,
        service,
        disableDependentServices: false,
        disableOnDestroy: false,
      }
    )
);

const functionSourceDir = path.resolve(__dirname, "function");

if (!fs.existsSync(functionSourceDir)) {
  throw new Error(
    `Unable to locate Cloud Function source directory at ${functionSourceDir}`
  );
}

const functionEntryPoint = path.join(functionSourceDir, "index.ts");
const functionPackageJson = path.join(functionSourceDir, "package.json");

const bunRuntime = (
  globalThis as {
    Bun?: {
      Transpiler?: new (options: {
        loader: string;
        target: string;
        format: string;
      }) => {
        transformSync: (
          source: string,
          options?: { filename?: string }
        ) => string;
      };
    };
  }
).Bun;

const tsSource = fs.readFileSync(functionEntryPoint, "utf8");

const compiledSource = (() => {
  if (bunRuntime?.Transpiler) {
    const transpiler = new bunRuntime.Transpiler({
      loader: "ts",
      target: "node",
      format: "cjs",
    });

    try {
      const code = transpiler.transformSync(tsSource, {
        filename: functionEntryPoint,
      });
      return pulumi.output(code);
    } catch (error) {
      throw new Error(
        `Bun failed to transpile Cloud Function source: ${
          (error as Error).message
        }`
      );
    }
  }

  return pulumi.output(
    (async () => {
      try {
        const tsImport = (await import("typescript")) as {
          default?: TypeScript;
        } & TypeScript;
        const tsModule = tsImport.default ?? (tsImport as TypeScript);

        const transpileResult = tsModule.transpileModule(tsSource, {
          compilerOptions: {
            module: tsModule.ModuleKind.CommonJS,
            target: tsModule.ScriptTarget.ES2022,
            esModuleInterop: true,
          },
          fileName: functionEntryPoint,
          reportDiagnostics: true,
        });

        if (transpileResult.diagnostics?.length) {
          const formatHost = {
            getCanonicalFileName: (fileName: string) => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n",
          };
          const message = tsModule.formatDiagnosticsWithColorAndContext(
            transpileResult.diagnostics,
            formatHost
          );
          throw new Error(
            `Cloud Function TypeScript compilation failed:\n${message}`
          );
        }

        return transpileResult.outputText;
      } catch (error) {
        if (
          error instanceof Error &&
          /Cannot find module 'typescript'/i.test(error.message)
        ) {
          throw new Error(
            'Bun transpilation is unavailable and the TypeScript compiler could not be loaded. Install "typescript" or run the Pulumi program with Bun.'
          );
        }
        throw error;
      }
    })()
  );
})();

const functionArchive = new pulumi.asset.AssetArchive({
  "index.js": compiledSource.apply(
    (code) => new pulumi.asset.StringAsset(code)
  ),
  "package.json": new pulumi.asset.FileAsset(functionPackageJson),
});

const sourceBucket = new gcp.storage.Bucket(
  "cloudbuild-event-source",
  {
    location: region,
    uniformBucketLevelAccess: true,
    forceDestroy: config.getBoolean("forceDestroyBucket") ?? false,
  },
  { dependsOn: enabledServices }
);

const sourceArchive = new gcp.storage.BucketObject(
  "cloudbuild-event-source-archive",
  {
    bucket: sourceBucket.name,
    source: functionArchive,
  },
  { dependsOn: enabledServices }
);

const cloudBuildTopic = new gcp.pubsub.Topic(
  "cloudbuild-topic",
  {
    name: cloudBuildTopicName,
    project,
  },
  { dependsOn: enabledServices }
);

const projectDetails = pulumi.output(
  gcp.organizations.getProject({
    projectId: project,
  })
);

const cloudFunction = new gcfv2.Function(
  "cloudbuild-event-forwarder",
  {
    project,
    location: region,
    description:
      "Forwards Cloud Build Pub/Sub events to the deployment webhook endpoint.",
    name: functionName,
    buildConfig: {
      runtime: "nodejs20",
      entryPoint: "handleCloudBuildEvent",
      source: {
        storageSource: {
          bucket: sourceBucket.name,
          object: sourceArchive.name,
        },
      },
    },
    serviceConfig: {
      availableMemory: "256M",
      timeoutSeconds: 60,
      environmentVariables: {
        TARGET_DEPLOYMENT_WEBHOOK: targetWebhook,
        TARGET_DEPLOYMENT_WEBHOOK_USERNAME: targetWebhookUsername,
        TARGET_DEPLOYMENT_WEBHOOK_PASSWORD: targetWebhookPassword,
      },
    },
    eventTrigger: {
      eventType: "google.cloud.pubsub.topic.v1.messagePublished",
      pubsubTopic: cloudBuildTopic.id,
      retryPolicy: "RETRY_POLICY_RETRY",
    },
  },
  { dependsOn: enabledServices, deleteBeforeReplace: true }
);

const projectNumber = projectDetails.apply(({ number }) => number);

new gcp.pubsub.TopicIAMMember(
  "cloudbuild-eventarc-subscriber",
  {
    project,
    topic: cloudBuildTopic.name,
    role: "roles/pubsub.subscriber",
    member: projectNumber.apply(
      (number) =>
        `serviceAccount:service-${number}@gcp-sa-pubsub.iam.gserviceaccount.com`
    ),
  },
  { dependsOn: [cloudBuildTopic, ...enabledServices] }
);

new gcp.pubsub.TopicIAMMember(
  "cloudbuild-topic-publisher",
  {
    project,
    topic: cloudBuildTopic.name,
    role: "roles/pubsub.publisher",
    member: projectNumber.apply(
      (number) =>
        `serviceAccount:service-${number}@gcp-sa-cloudbuild.iam.gserviceaccount.com`
    ),
  },
  { dependsOn: [cloudBuildTopic, ...enabledServices] }
);

export const cloudBuildForwarderName = cloudFunction.name;
export const cloudBuildForwarderRegion = cloudFunction.location;
export const deploymentWebhookUrl = targetWebhook;
