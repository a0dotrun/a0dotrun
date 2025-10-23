import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'
import { env } from '@riverly/app/env'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => auth(env).handler(request),
      POST: ({ request }) => auth(env).handler(request),
    },
    // handlers: {
    //   GET: ({ request }) => Database.use(() => auth.handler(request)),
    //   POST: ({ request }) => Database.use(() => auth.handler(request)),
    // },
    // handlers: {
    //   GET: ({ request }) => {
    //     return auth.handler(request)
    //   },
    //   POST: ({ request }) => {
    //     return auth.handler(request)
    //   },
    // },
  },
})
