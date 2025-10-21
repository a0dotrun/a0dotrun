import { createFileRoute } from '@tanstack/react-router'
import { GitHubSelectRepo } from '@/components/commons/github-select-repo'
import { AddServerForm } from '@/components/server/add-server-form'

export const Route = createFileRoute('/_auth/$username/_dash/servers/new')({
  component: RouteComponent,
})

function RouteComponent() {
  const { sessionUser } = Route.useRouteContext()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-20">
          <div>
            <h1 className="text-2xl font-mono font-semibold">Add new Server</h1>
          </div>
        </div>
        <hr className="py-4" />
        <div className="flex flex-col max-w-3xl space-y-6">
          <GitHubSelectRepo username={sessionUser.username} />
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <div className="text-sm text-muted-foreground">OR</div>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <AddServerForm username={sessionUser.username} />
        </div>
      </div>
    </div>
  )
}
