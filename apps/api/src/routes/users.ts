import { Hono } from "hono";
import { ErrorCodeEnum } from "./errors";
import { User } from "@riverly/app";

const app = new Hono();

app.get("/:username", async (c) => {
  const username = c.req.param("username");
  const publicUser = await User.fromUsername(username);
  if (!publicUser) {
    return c.json(
      {
        error: {
          code: ErrorCodeEnum.NOT_FOUND,
          message: "User not found or does not exist",
        },
      },
      404
    );
  }
  const { userId, name, createdAt, updatedAt, image } = publicUser;
  return c.json({
    userId,
    image,
    username,
    name,
    createdAt,
    updatedAt,
  });
});

export default app;
