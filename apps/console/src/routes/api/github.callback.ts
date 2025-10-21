import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import { BetterAuthSession } from '@/lib/auth-types'
import { GitHub, User } from '@a0dotrun/app'
import { Database } from '@a0dotrun/app/db'
import { UserTable } from '@a0dotrun/app/db/schema'
import { GitHubInstallationSetupValue } from '@a0dotrun/app/ty'
import { z } from 'zod'
import { a0GitHubAppID } from '@a0dotrun/app/config'

const callbackSearchSchema = z.object({
  installationId: z.number(),
  setupAction: z
    .enum([
      GitHubInstallationSetupValue.INSTALL,
      GitHubInstallationSetupValue.UPDATE,
    ])
    .default(GitHubInstallationSetupValue.UPDATE),
})

export const Route = createFileRoute('/api/github/callback')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        Database.use(async () => {
          const url = new URL(request.url)
          const { searchParams } = url
          const installationId = searchParams.get('installation_id')
          const setupAction = searchParams.get('setup_action')

          const parsedParams = {
            installationId: installationId ? Number(installationId) : undefined,
            setupAction: setupAction ?? undefined,
          }

          try {
            const session = (await auth.api.getSession({
              headers: request.headers,
            })) as BetterAuthSession | null

            if (!session) {
              return Response.redirect(new URL('/login', request.url))
            }

            const sessionUser = User.toSession(session.user as UserTable)

            const validatedParams = callbackSearchSchema.parse(parsedParams)
            const installationDetails = await GitHub.installationDetails(
              validatedParams.installationId,
            )

            await GitHub.upsertApp({
              userId: sessionUser.userId,
              githubAppId: a0GitHubAppID(),
              githubInstallationId: validatedParams.installationId,
              setupAction: validatedParams.setupAction,
              accountId: installationDetails.accountId,
              accountType: installationDetails.accountType,
              accountLogin: installationDetails.accountLogin,
            })

            return Response.redirect(new URL('/github/installed', request.url))
          } catch (err) {
            console.error(err)
            return new Response('Bad Request', { status: 400 })
          }
        }),
    },
  },
})
