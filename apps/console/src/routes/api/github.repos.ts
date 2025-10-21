import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'
import type { BetterAuthSession } from '@/lib/auth-types'
import { GitHub } from '@a0dotrun/app'
import { a0GitHubAppID } from '@a0dotrun/app/config'

export const Route = createFileRoute('/api/github/repos')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = (await auth.api.getSession({
          headers: getRequestHeaders(),
        })) as BetterAuthSession | null
        if (!session) return Response.redirect(new URL('/login', request.url))

        const { searchParams } = new URL(request.url)
        const owner = searchParams.get('owner') ?? session.user.username

        const ghAppInstall = await GitHub.userInstallation({
          userId: session.user.id,
          githubAppId: a0GitHubAppID(),
          account: owner,
        })
        if (!ghAppInstall || !ghAppInstall.githubInstallationId)
          return Response.json({
            isInstalled: false,
            repos: [],
          })

        const repos = await GitHub.repos(ghAppInstall.githubInstallationId)
        return Response.json({
          isInstalled: true,
          repos,
        })
      },
    },
  },
})
