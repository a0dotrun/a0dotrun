import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import z from "zod/v4";

const hyperdriveBinding = "HYPERDRIVE";

const hyperdriveLocalConnectionString =
  process.env[
    `CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_${hyperdriveBinding}`
  ] ??
  process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING ??
  process.env.HYPERDRIVE_LOCAL_CONNECTION_STRING;

const hyperdriveRemoteConnectionString =
  process.env[
    `CLOUDFLARE_HYPERDRIVE_REMOTE_CONNECTION_STRING_${hyperdriveBinding}`
  ] ??
  process.env.CLOUDFLARE_HYPERDRIVE_REMOTE_CONNECTION_STRING ??
  process.env.HYPERDRIVE_REMOTE_CONNECTION_STRING;

const runtimeEnv = {
  ...process.env,
  DATABASE_URL:
    hyperdriveLocalConnectionString ??
    hyperdriveRemoteConnectionString ??
    process.env.DATABASE_URL,
};

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),

    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),

    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),

    BASEURL: z.url(),
    API_BASEURL: z.url(),
    GITHUB_APP_ID: z.coerce.number(),
    GITHUB_PRIVATE_KEY_BASE64: z.string().min(1),

    INTERNAL_WEBHOOK_USERNAME: z.string().min(1),
    INTERNAL_WEBHOOK_PASSWORD: z.string().min(1),

    ELECTRIC_SYNC_BASEURL: z.url(),
  },

  runtimeEnv,
  emptyStringAsUndefined: true,
});

process.env.DATABASE_URL = env.DATABASE_URL;

export type Env = typeof env;
