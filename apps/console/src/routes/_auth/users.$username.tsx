import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/users/$username')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/users/$username"!</div>
}
