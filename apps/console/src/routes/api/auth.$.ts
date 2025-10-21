import { auth } from '@/lib/auth'
import { Database } from '@a0dotrun/app/db'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => Database.use(() => auth.handler(request)),
      POST: ({ request }) => Database.use(() => auth.handler(request)),
    },
  },
})
