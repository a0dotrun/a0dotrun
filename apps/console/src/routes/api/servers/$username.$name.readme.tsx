import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { Server, User } from '@a0dotrun/app'
import { Database } from '@a0dotrun/app/db'
import { ServerVisibilityEnum } from '@a0dotrun/app/ty'
import type { UserTable } from '@a0dotrun/app/db/schema'
import type { BetterAuthSession } from '@/lib/auth-types'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/servers/$username/$name/readme')({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        Database.use(async () => {
          const session = (await auth.api.getSession({
            headers: getRequestHeaders(),
          })) as BetterAuthSession | null
          if (!session) return Response.redirect(new URL('/login', request.url))

          const { username, name } = params

          const server = await Server.fromName({
            callerUserId: session.user.id,
            username,
            name,
          })

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
        }),
    },
  },
})
