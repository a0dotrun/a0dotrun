import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { verifyBetterAuthToken } from "../middlewares/middlewares";

const app = new Hono();

app.get(
  "/validate",
  bearerAuth({ verifyToken: verifyBetterAuthToken }),
  async (c) => {
    // Just respond with ok: true
    // This is to validate JWT token without much payload.
    return c.json(
      {
        ok: true,
      },
      200
    );
  }
);

export default app;
