import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { User } from '@a0dotrun/app'
import type { BetterAuthSession } from './auth-types'
import { authClient } from '@/lib/auth-client'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const result = await authClient.getSession({
    fetchOptions: {
      headers: getRequestHeaders(),
    },
  })
  const session = result.data as BetterAuthSession | null
  return await next({
    context: {
      user: session?.user
        ? User.toSession({
            ...session.user,
            image: session.user.image as string,
          })
        : null,
    },
  })
})
