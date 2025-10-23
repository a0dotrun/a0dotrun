import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { GitHub } from '@a0dotrun/app'
import { env } from '@a0dotrun/app/env'
import type { BetterAuthSession } from '@/lib/auth-types'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/github/installs')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = (await auth(env).api.getSession({
          headers: getRequestHeaders(),
        })) as BetterAuthSession | null
        if (!session) return Response.redirect(new URL('/login', request.url))

        const installs = await GitHub.userInstalls({
          userId: session.user.id,
          githubAppId: env.GITHUB_APP_ID,
        })

        return Response.json({
          installs,
        })
      },
    },
  },
})
