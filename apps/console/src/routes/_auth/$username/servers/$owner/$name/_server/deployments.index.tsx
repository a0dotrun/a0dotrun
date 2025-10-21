import { createFileRoute, notFound } from '@tanstack/react-router'
import { getServerFromNameFn, serverDeploymentsFn } from '@/funcs'
import { DeploymentPreview } from '@/components/deployment/preview'

export const Route = createFileRoute(
  '/_auth/$username/servers/$owner/$name/_server/deployments/',
)({
  loader: async ({ params, context }) => {
    const server = await getServerFromNameFn({
      data: {
        username: params.owner,
        name: params.name,
      },
    })
    if (!server) throw notFound()
    const deployments = await serverDeploymentsFn({
      data: {
        userId: context.sessionUser.userId,
        serverId: server.serverId,
        limit: 100,
        target: 'all',
      },
    })
    return { deployments }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { deployments } = Route.useLoaderData()
  return (
    <div className="flex flex-col space-y-4 w-full md:w-3/4">
      {deployments.length > 0 ? (
        deployments.map((deployment) => (
          <DeploymentPreview
            key={deployment.deploymentId}
            deployment={deployment}
          />
        ))
      ) : (
        <div className="text-muted-foreground">
          No deployments match the current filters.
        </div>
      )}
    </div>
  )
}
