import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '@/lib/auth-middleware'

export const getUserID = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(({ context }) => {
    return context.user?.userId
  })

export const getSessionUser = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(({ context }) => {
    return context.user
  })
