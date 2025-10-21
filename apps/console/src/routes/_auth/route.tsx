import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSessionUser } from '@/lib/auth-server-fn'

export const Route = createFileRoute('/_auth')({
  beforeLoad: async () => {
    const sessionUser = await getSessionUser()
    if (!sessionUser) throw redirect({ to: '/login/$' })
    return {
      sessionUser,
    }
  },
})
