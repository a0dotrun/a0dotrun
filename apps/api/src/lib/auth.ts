import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { Database } from "@a0dotrun/app/db";
import {
  users,
  sessions,
  accounts,
  verifications,
  jwks,
  UserType,
} from "@a0dotrun/app/db/schema";
import { env } from "@a0dotrun/app/env";

export const authConfig = {
  emailAndPassword: {
    enabled: false,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,

      mapProfileToUser: (profile: any) => {
        return {
          name: profile.name || profile.login,
          email: profile.email,
          username: profile.login,
          githubId: profile.id.toString(),
          image: profile.avatar_url,
        };
      },
    },
  },
  user: {
    additionalFields: {
      username: { type: "string", required: false, input: true },
      githubId: { type: "string", required: false, input: true },
      isStaff: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      isBlocked: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      type: {
        type: "string",
        required: false,
        defaultValue: UserType.USER,
        input: false,
      },
    },
  },
} as const;

const auth: ReturnType<typeof betterAuth> = betterAuth({
  ...authConfig,
  database: drizzleAdapter(Database.db(), {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
      jwks: jwks,
    },
  }),
  plugins: [
    jwt({
      jwt: {
        issuer: env.BASEURL,
        audience: env.API_BASEURL,
        expirationTime: "90d",
      },
    }),
  ], // make sure this is the last plugin in the array
});

export { auth };
