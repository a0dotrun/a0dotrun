import { Storage } from "@google-cloud/storage";
import { zValidator } from "@hono/zod-validator";
import { ServerModeEnum } from "@riverly/app/ty";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { z } from "zod";
import { verifyBetterAuthToken } from "../middlewares/middlewares";
import { ErrorCode } from "./errors";
import { Server } from "@riverly/app";

const app = new Hono();

const artifactBucket = process.env.ARTIFACT_BUCKET!;

const artifactSchema = z.object({
  name: z.string(),
  suffix: z.string().default("tar.gz"), // defaults to .tar.gz compression (set by `riverlytech/a0ctl`)
  version: z.string().optional().default("latest"), // defaults to latest
});

app.post(
  "/",
  bearerAuth({ verifyToken: verifyBetterAuthToken }),
  zValidator("json", artifactSchema, (result, c) => {
    if (!result.success) return c.text("Invalid", 400);
  }),
  async (c) => {
    const sessionUser = c.get("user");
    const body = c.req.valid("json");
    const { name, suffix, version } = body;

    const ownedServer = await Server.ownedServer({
      username: sessionUser.username,
      name,
    });
    if (!ownedServer) {
      return c.json(
        {
          error: {
            code: ErrorCode.not_found,
            message: "Server not found",
          },
        },
        404
      );
    }

    if (ownedServer.mode === ServerModeEnum.LOCAL) {
      return c.json(
        {
          error: {
            code: ErrorCode.forbidden,
            message: "Local server cannot be deployed",
          },
        },
        403
      );
    }

    // use sha-like hash for caching and dedup
    const storage = new Storage();

    // absolutePath:
    // <userId>/<serverId>:<version>.<suffix>

    // NOTE:
    // compression suffix as set by client (cli): `riverlytech/a0ctl`
    // must also implement said compression.
    const absolutePath = `${sessionUser.userId}/servers/${ownedServer.serverId}:${version}.${suffix}`;
    const expires = Date.now() + 60 * 60 * 1000;

    const [url] = await storage
      .bucket(artifactBucket)
      .file(absolutePath)
      .getSignedUrl({
        action: "write",
        contentType: "application/octet-stream",
        expires,
      });

    return c.json({
      uploadUrl: url,
      expires,
      artifact: absolutePath,
    });
  }
);

export default app;
