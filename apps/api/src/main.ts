import "dotenv/config";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { verifyBetterAuthToken } from "./middlewares/middlewares";
import authRoutes from "./routes/auth";
import serverRoutes from "./routes/servers";
import userRoutes from "./routes/users";
import deploymentRoutes from "./routes/deployments";
import v1internalRoutes from "./routes/v1internal";
import type { SessionUser } from "@riverly/app/ty";

declare module "hono" {
  interface ContextVariableMap {
    user: SessionUser;
  }
}

const app = new Hono({ strict: false });

app.use(async (c, next) => {
  const start = Date.now();
  await next();
  const end = Date.now();
  c.res.headers.set("X-Response-Time", `${end - start}`);
});

app.get("/", (c) => {
  return c.text("Ok");
});

app.get(
  "/v1/user",
  bearerAuth({ verifyToken: verifyBetterAuthToken }),
  async (c) => {
    const sessionUser = c.get("user");
    // modify this route for fetching authenticated user,
    // perhaps to a DB call to fetch more details.
    return c.json(sessionUser);
  }
);

app.route("/v1/auth", authRoutes);
app.route("/v1/server", serverRoutes);
app.route("/v1/users", userRoutes);
app.route("/v1/deployment", deploymentRoutes);
app.route("/__/v1", v1internalRoutes);

// export default {
//   port: 8080,
//   hostname: "0.0.0.0",
//   fetch: app.fetch,
//   listen: {
//     ipv6Only: false, // Allows both IPv6 and IPv4
//   },
// };

const port = Number(process.env.PORT ?? "5000");

Bun.serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
  idleTimeout: 120,
});

console.info(`API listening on http://0.0.0.0:${port}`);
