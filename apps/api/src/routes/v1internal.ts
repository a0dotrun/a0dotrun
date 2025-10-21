import { zValidator } from "@hono/zod-validator";
import { ServerDeployment } from "@a0dotrun/app";
import { InsertDeploymentLog } from "@a0dotrun/app/db/schema";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { z } from "zod";
import { ErrorCode } from "./errors";
import {
  type CloudBuildStatus,
  CloudBuildStatusEnum,
  toDeploymentStatusEnum,
  isTerminalStatus,
} from "@a0dotrun/app/infra/providers/gcp";
import { basicAuth } from "hono/basic-auth";
import { DeploymentStatusEnum } from "@a0dotrun/app/ty";

const app = new Hono();


const internalWebhookUsername =
  process.env.A0_INTERNAL_WEBHOOK_USERNAME || "a0runner";
const internalWebhookPassword =
  process.env.A0_INTERNAL_WEBHOOK_PASSWORD || "VeryS3Cure";

app.get("/", (c) => {
  return c.text("Ok");
});

app.post(
  "/deployments/gcp/events",
  basicAuth({
    username: internalWebhookUsername,
    password: internalWebhookPassword,
  }),
  async (c) => {
    const body = await c.req.json();
    const eventId = (body?.context.eventId as string) || null;
    const cbBuildID = (body?.attributes?.buildId as string) || null;
    const cbStatus =
      (body?.attributes?.status as CloudBuildStatus) ||
      CloudBuildStatusEnum.STATUS_UNKNOWN;

    const tags: string[] = body?.build?.tags || [];

    console.info(
      `Received Event ID: ${eventId ?? "unknown"} for build ID: ${cbBuildID ?? "unknown"}`
    );

    if (!eventId && !cbBuildID) {
      console.warn(`Ignoring event has missing identifiers`);
      return c.json({ ok: false }, 200);
    }

    const deploymentTag = tags.find((tag) => tag.startsWith("deployment-id-"));
    const buildTag = tags.find((tag) => tag.startsWith("build-id-"));
    const cbType = tags.find(
      (tag) =>
        tag === "ty-build-n-deploy" || tag === "ty-deploy" || tag === "ty-build"
    );
    if (!deploymentTag || !buildTag || !cbType) {
      console.warn(
        `Ignoring event has missing tag(s) 'deployment-id-*', 'build-id-*' or 'ty-*' is not set or not available`
      );
      return c.json({ ok: false }, 200);
    }

    const deploymentId = deploymentTag.replace("deployment-id-", "");
    const buildId = buildTag.replace("build-id-", "");
    const status = toDeploymentStatusEnum(cbStatus);
    if (cbType === "ty-build-n-deploy") {
      const isTerminal = isTerminalStatus(cbStatus);
      console.info(
        `Updating DeploymentID: ${deploymentId} BuildID: ${buildId} Status: ${status}`
      );

      let finalImageRef: string | null = null;
      let imageDigest: string | null = null;

      if (status === DeploymentStatusEnum.READY) {
        const primaryImageResult =
          (body?.build?.results?.images[0] as {
            name: string;
            digest: string;
          }) || null;
        if (primaryImageResult) {
          finalImageRef = primaryImageResult.name;
          imageDigest = primaryImageResult.digest;
        }
      }

      await ServerDeployment.updateBuildDeploy({
        build: {
          status: status,
          builtAt: isTerminal ? new Date() : undefined,
          imageDigest: imageDigest || undefined,
          imageRef: finalImageRef || undefined,
        },
        deployment: { status: status },
        buildId,
        deploymentId,
      });
    } else if (cbType === "ty-build") {
    } else if (cbType === "ty-deploy") {
    }

    return c.json(
      {
        ok: true,
      },
      200
    );
  }
);

// const DeploymentLogDrain = z.object({
//   level: z.string().default("info"),
//   deploymentId: z.string(),
//   timestamp: z.number(),
//   msg: z.string().default(""),
// });

// app.post(
//   "/deployments/log",
//   bearerAuth({ verifyToken: verifyInternalServiceToken }),
//   async (c) => {
//     const sessionUser = c.get("user");
//     const body = await c.req.json();
//     const bodyParsed = DeploymentLogDrain.safeParse(body);
//     if (!bodyParsed.success) {
//       return c.json(
//         {
//           error: {
//             message: bodyParsed.error,
//             code: ErrorCode.bad_request,
//           },
//         },
//         200
//       );
//     }

//     const request: z.infer<typeof InsertDeploymentLog> = {
//       userId: sessionUser.userId,
//       deploymentId: bodyParsed.data.deploymentId,
//       message: bodyParsed.data.msg,
//       timestamp: bodyParsed.data.timestamp as unknown as Date, // satisfy TS as zod already does coerce
//       level: bodyParsed.data.level,
//     };
//     const requestParsed = InsertDeploymentLog.safeParse(request);
//     if (!requestParsed.success) {
//       console.error(
//         "[Notify] Bad Request deployment log record. Fix deployment log drain"
//       );
//       return c.json(
//         {
//           error: {
//             message: requestParsed.error,
//             code: ErrorCode.bad_request,
//           },
//         },
//         200
//       );
//     }
//     const logId = await ServerDeployment.ingestLog.force(requestParsed.data);
//     return c.json({ ok: true, logId }, 200);
//   }
// );

export default app;
