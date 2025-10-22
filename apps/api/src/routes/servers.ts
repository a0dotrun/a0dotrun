import { zValidator } from "@hono/zod-validator";
import { AddServer } from "@a0dotrun/app/db/schema";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { verifyBetterAuthToken } from "../middlewares/middlewares";
import { ErrorCode } from "./errors";
import { Server } from "@a0dotrun/app";
import { z } from "zod";
import { env } from "@a0dotrun/app/env";

const app = new Hono();

const AddServerRequest = AddServer.omit({
  userId: true,
  addedById: true,
  username: true,
  avatarUrl: true,
})
  .required()
  .extend({
    avatarUrl: z.url().optional(),
    repoUrl: z.string().optional(),
  });

// .superRefine((data, ctx) => {
//   const hasName = !!data.name;
//   const hasRepoUrl = !!data.repoUrl;
//   const count = [hasName, hasRepoUrl].filter(Boolean).length;
//   if (count === 0) {
//     ctx.addIssue({
//       code: "custom",
//       message: "You must provide exactly one of: `name`, `repoUrl`.",
//       path: [], // global error
//     });
//   } else if (count > 1) {
//     ctx.addIssue({
//       code: "custom",
//       message: "Only one of `name`, `repoUrl` can be provided at a time.",
//       path: [], // global error
//     });
//   }
// });

app.post(
  "/",
  bearerAuth({ verifyToken: verifyBetterAuthToken }),
  zValidator("json", AddServerRequest, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            message: result.error,
            code: ErrorCode.bad_request,
          },
        },
        400
      );
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const sessionUser = c.get("user");

    const baseRequest = {
      name: body.name,
      title: body.title,
      description: body.description,
      userId: sessionUser.userId,
      username: sessionUser.username,
      visibility: body.visibility,
      addedById: sessionUser.userId,
    };

    if (body.repoUrl) {
      const result = await Server.importFromGitHub({
        ...baseRequest,
        repoUrl: body.repoUrl as string,
        githubAppId: env.GITHUB_APP_ID,
      });
      return c.json({
        serverId: result.serverId,
        username: result.username,
        name: result.name,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    } else {
      const result = await Server.addNew({ ...baseRequest });
      return c.json({
        serverId: result.serverId,
        username: result.username,
        name: result.name,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      });
    }
  }
);

export default app;
