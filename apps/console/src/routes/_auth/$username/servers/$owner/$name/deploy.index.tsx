import { getServerFromNameFn } from '@/funcs'
import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GitHubDeployServerForm } from '@/components/deployment/deploy-server-form'

export const Route = createFileRoute(
  '/_auth/$username/servers/$owner/$name/deploy/',
)({
  loader: async ({ params }) => {
    const { owner, name } = params

    const server = await getServerFromNameFn({
      data: {
        username: owner,
        name,
      },
    })
    if (!server) throw notFound()
    return {
      server,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { server } = Route.useLoaderData()
  const { username } = Route.useParams()
  const serverAvatarUrl =
    server.avatarUrl || `https://avatar.vercel.sh/${server.name}`

  return (
    <div className="flex flex-col max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={serverAvatarUrl} alt={server.name} />
          <AvatarFallback className="text-xl">{server.name[0]}</AvatarFallback>
        </Avatar>
        <div className="text-xl">
          <Link
            to="/users/$username"
            params={{ username: server.username }}
            className="text-muted-foreground underline decoration-1 hover:decoration-2 underline-offset-4"
          >
            {server.username}
          </Link>
          <span className="mx-1 text-muted-foreground">/</span>
          <span className="text-primary">{server.name}</span>
        </div>
      </div>
      <GitHubDeployServerForm
        username={username}
        name={server.name}
        repo={server.repository as string}
      />
    </div>
  )
}
