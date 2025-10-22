import { createAuthClient } from 'better-auth/react'
import { env } from '@a0dotrun/app/env'

export const authClient = createAuthClient({
  baseURL: env.VITE_PUBLIC_BASE_URL,
})
