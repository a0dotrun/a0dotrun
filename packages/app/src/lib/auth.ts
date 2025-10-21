import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt } from "better-auth/plugins";
import { reactStartCookies } from "better-auth/react-start";
import { db } from "../db";
import {
  users,
  sessions,
  accounts,
  verifications,
  jwks,
  UserType,
} from "../db/schema";
import { a0BaseUrl, a0APIBaseUrl } from "../config";

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
  database: drizzleAdapter(db, {
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
        issuer: a0BaseUrl(),
        audience: a0APIBaseUrl(),
        expirationTime: "90d",
      },
    }),
    reactStartCookies(),
  ], // make sure this is the last plugin in the array
});

export { auth };
