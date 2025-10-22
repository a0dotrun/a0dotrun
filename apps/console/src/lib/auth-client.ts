import { createAuthClient } from 'better-auth/react'

const a0BaseUrl = import.meta.env.VITE_A0_BASEURL

export const authClient = createAuthClient({
  baseURL: a0BaseUrl,
})
