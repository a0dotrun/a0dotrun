import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { jwt } from 'better-auth/plugins'
import { reactStartCookies } from 'better-auth/react-start'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import {
  UserType,
  accounts,
  jwks,
  sessions,
  users,
  verifications,
} from '@riverly/app/db/schema'
import { env, type Env } from '@riverly/app/env'

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

// const auth: ReturnType<typeof betterAuth> = betterAuth({
//   appName: 'Riverly',
//   ...authConfig,
//   database: drizzleAdapter(Database.db(), {
//     provider: 'pg',
//     schema: {
//       user: users,
//       session: sessions,
//       account: accounts,
//       verification: verifications,
//       jwks: jwks,
//     },
//   }),
//   plugins: [
//     jwt({
//       jwt: {
//         issuer: env.BASEURL,
//         audience: env.API_BASEURL,
//         expirationTime: '90d',
//       },
//     }),
//     reactStartCookies(),
//   ], // make sure this is the last plugin in the array
// })

export const auth = (env: Env): ReturnType<typeof betterAuth> => {
  const result = postgres(env.DATABASE_URL)
  const db = drizzle(result, { casing: 'snake_case' })
  return betterAuth({
    appName: 'Riverly',
    ...authConfig,
    database: drizzleAdapter(db, {
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
    ],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
  })
}

export type AuthInstance = ReturnType<typeof auth>
