import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'
import type { BetterAuthSession } from '@/lib/auth-types'
import { GitHub } from '@a0dotrun/app'
import { Database } from '@a0dotrun/app/db'
import { a0GitHubAppID } from '@a0dotrun/app/config'

export const Route = createFileRoute('/api/github/installs')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        Database.use(async () => {
          const session = (await auth.api.getSession({
            headers: getRequestHeaders(),
          })) as BetterAuthSession | null
          if (!session) return Response.redirect(new URL('/login', request.url))

          const installs = await GitHub.userInstalls({
            userId: session.user.id,
            githubAppId: a0GitHubAppID(),
          })

          return Response.json({
            installs,
          })
        }),
    },
  },
})
