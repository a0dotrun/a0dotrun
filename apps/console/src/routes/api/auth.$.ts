import { Database } from '@a0dotrun/app/db'
import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: ({ request }) => Database.use(() => auth.handler(request)),
      POST: ({ request }) => Database.use(() => auth.handler(request)),
    },
  },
})
