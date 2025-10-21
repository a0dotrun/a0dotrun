import { createFileRoute } from '@tanstack/react-router'
import { deploymentsFn } from '@/funcs'
import { DeploymentPreview } from '@/components/deployment/preview'

export const Route = createFileRoute(
  '/_auth/$username/_dash/deployments/preview',
)({
  loader: async ({ context }) => {
    const deployments = await deploymentsFn({
      data: {
        userId: context.sessionUser.userId,
        limit: 100,
        target: 'preview',
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
