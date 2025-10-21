import z from "zod/v4";

const defaultRegion = () => process.env.A0RUN_GCP_REGION || "us-central1";
const ghSecretKeyName = () =>
  process.env.A0RUN_GH_SECRET_KEY || "a0-github-private-key-raw";
const gcpProjectId = () => process.env.A0RUN_GCP_PROJECT_ID || "a0run-001";

export const gcpConfigSchema = z.object({
  GCP_REGION: z.string().default(defaultRegion()),
  GH_SECRET_KEY: z.string().default(ghSecretKeyName()),
  GCP_PROJECT_ID: z.string().default(gcpProjectId()),
});

export const gcpCloudBuildConfigSchema = z.object({
  maxTimeoutSeconds: z.number().default(1200),
  dockerBuildTimeout: z.string().default("600s"),
});

// We can have setup something like remote gcp config
// which can be fetched with rpc call for dynamically
// loading stored config.
// KV store ?
