import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./src/env";

export default defineConfig({
  out: "./migrations/",
  strict: true,
  schema: "./src/db/schema/index.ts",
  verbose: true,
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
