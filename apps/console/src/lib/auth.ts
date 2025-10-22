// export * from "@a0dotrun/app/auth"

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { reactStartCookies } from 'better-auth/react-start'
import { Database } from '@a0dotrun/app/db'
import {
  UserType,
  accounts,
  jwks,
  sessions,
  users,
  verifications,
} from '@a0dotrun/app/db/schema'
import { env } from '@a0dotrun/app/env'

export const authConfig = {
  emailAndPassword: {
    enabled: false,
    requireEmailVerification: false,
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,

      mapProfileToUser: (profile: any) => {
        return {
          name: profile.name || profile.login,
          email: profile.email,
          username: profile.login,
          githubId: profile.id.toString(),
          image: profile.avatar_url,
        }
      },
    },
  },
  user: {
    additionalFields: {
      username: { type: 'string', required: false, input: true },
      githubId: { type: 'string', required: false, input: true },
      isStaff: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      isBlocked: {
        type: 'boolean',
        required: false,
        defaultValue: false,
        input: false,
      },
      type: {
        type: 'string',
        required: false,
        defaultValue: UserType.USER,
        input: false,
      },
    },
  },
} as const

// Create a wrapper that exposes Database.use for the drizzle adapter
const createDatabaseWrapper = () => {
  return new Proxy({} as any, {
    get(_target, prop) {
      // Intercept all method calls and route through Database.use
      return (...args: Array<any>) => {
        return Database.use(async (db: any) => {
          return await db[prop](...args)
        })
      }
    },
  })
}

const auth: ReturnType<typeof betterAuth> = betterAuth({
  ...authConfig,
  database: drizzleAdapter(createDatabaseWrapper(), {
    provider: 'pg',
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
        expirationTime: '90d',
      },
    }),
    reactStartCookies(),
  ], // make sure this is the last plugin in the array
})

export { auth }
