import { createFileRoute } from '@tanstack/react-router'
import { userInstalledServersFn } from '@/funcs'
import { UserServerCard } from '@/components/server/preview'
import { DeployYourOwn } from '@/components/server/deploy-your-own'

export const Route = createFileRoute('/_auth/$username/_dash/servers/_list/')({
  loader: async ({ context }) => {
    const servers = await userInstalledServersFn({
      data: {
        userId: context.sessionUser.userId,
        limit: 100,
        visibility: 'both',
      },
    })
    return { servers }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { servers } = Route.useLoaderData()
  const { username } = Route.useParams()
  return (
    <div className="flex flex-col space-y-4 w-full md:w-3/4">
      {servers.length > 0 ? (
        servers.map((server) => (
          <UserServerCard
            key={server.serverId}
            username={username}
            server={server}
          />
        ))
      ) : (
        <DeployYourOwn />
      )}
    </div>
  )
}
