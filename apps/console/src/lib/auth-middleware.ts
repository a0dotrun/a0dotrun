import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { User } from '@a0dotrun/app'
import type { BetterAuthSession } from './auth-types'
import { auth } from './auth'
import { env } from '@a0dotrun/app/env'

// export const authMiddleware = createMiddleware().server(async ({ next }) => {
//   const result = await authClient.getSession({
//     fetchOptions: {
//       headers: getRequestHeaders(),
//     },
//   })
//   const session = result.data as BetterAuthSession | null
//   return await next({
//     context: {
//       user: session?.user
//         ? User.toSession({
//             ...session.user,
//             image: session.user.image as string,
//           })
//         : null,
//     },
//   })
// })

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = (await auth(env).api.getSession({
    headers: getRequest().headers,
    query: {
      // Disabling cookie cache will force DB request, we dont want that.
      // Let's use the cache
      // https://www.better-auth.com/docs/concepts/session-management#session-caching
      disableCookieCache: false,
    },
  })) as BetterAuthSession | null

  return await next({
    context: {
      user: session
        ? User.toSession({
            ...session.user,
            image: session.user.image as string,
          })
        : null,
    },
  })
})
