import { createFileRoute } from '@tanstack/react-router'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '@/lib/auth'
import type { BetterAuthSession } from '@/lib/auth-types'
import { a0ElectricSyncBaseUrl } from '@a0dotrun/app/config'
import { Database } from '@a0dotrun/app/db'
import axios from 'axios'

export const Route = createFileRoute('/api/sync/v1')({
  server: {
    handlers: {
      GET: async ({ request }) =>
        Database.use(async () => {
          const session = (await auth.api.getSession({
            headers: getRequestHeaders(),
          })) as BetterAuthSession | null
          if (!session)
            return Response.json(
              {
                error: { message: 'Unauthorized' },
              },
              { status: 401 },
            )
          const requestUrl = new URL(request.url)
          const electricUrl = new URL(`${a0ElectricSyncBaseUrl()}/v1/shape`)
          const params = new URLSearchParams()
          requestUrl.searchParams.forEach((value, key) => {
            if (
              ['live', 'table', 'handle', 'offset', 'cursor', 'where'].includes(
                key,
              )
            ) {
              params.set(key, value)
            }
          })

          const response = await axios.get(electricUrl.toString(), {
            params: Object.fromEntries(params),
            responseType: 'stream',
            validateStatus: () => true, // Don't throw on any status code
          })

          const responseHeaders = new Headers()
          Object.entries(response.headers).forEach(([key, value]) => {
            if (
              !['content-encoding', 'content-length'].includes(
                key.toLowerCase(),
              ) &&
              typeof value === 'string'
            ) {
              responseHeaders.set(key, value)
            }
          })

          return new Response(response.data, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          })
        }),
    },
  },
})
