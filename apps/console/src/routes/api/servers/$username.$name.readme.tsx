import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'
import type { BetterAuthSession } from '@/lib/auth-types'
import { Server, User } from '@a0dotrun/app'
import type { UserTable } from '@a0dotrun/app/db/schema'
import { ServerVisibilityEnum } from '@a0dotrun/app/ty'

export const Route = createFileRoute('/api/servers/$username/$name/readme')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = (await auth.api.getSession({
          headers: getRequestHeaders(),
        })) as BetterAuthSession | null
        if (!session) return Response.redirect(new URL('/login', request.url))

        const { username, name } = params
        let server

        if (!session) {
          server = await Server.publicServer({ username, name })
        } else {
          const sessionUser = User.toSession(session.user as UserTable)
          server = await Server.fromName({
            callerUserId: sessionUser.userId,
            username,
            name,
          })
        }

        if (!server) {
          return Response.json(
            {
              error: {
                message: `Server not found for ${username}/${name}`,
              },
            },
            { status: 404 },
          )
        }

        const readmeUrl =
          server.visibility === ServerVisibilityEnum.PUBLIC
            ? server.readme?.gitDownloadUrl
            : server.readme?.s3Url

        if (!readmeUrl) {
          return new Response(null, { status: 404 })
        }
        const res = await fetch(readmeUrl)
        if (!res.ok) {
          return new Response(null, { status: res.status })
        }
        const text = await res.text()
        return new Response(text, {
          headers: {
            'Content-Type': 'text/plain',
          },
        })
      },
    },
  },
})
