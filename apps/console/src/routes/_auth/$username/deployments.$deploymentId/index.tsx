import { createFileRoute } from '@tanstack/react-router'
import { userDeployment } from '@/funcs'
import { DeploymentDetail } from '@/components/deployment/detail'
import { WithClient } from '@/components/commons/with-client'
import { DeploymentLogs } from '@/components/deployment/deployment-logs'

export const Route = createFileRoute(
  '/_auth/$username/deployments/$deploymentId/',
)({
  loader: async ({ params: { deploymentId } }) => {
    const deployment = await userDeployment({ data: { deploymentId } })
    return {
      deployment,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { sessionUser } = Route.useRouteContext()
  const { deployment } = Route.useLoaderData()
  const { username, deploymentId } = Route.useParams()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-14">
          <h1 className="text-xl font-mono font-semibold">
            Deployment Details
          </h1>
        </div>
        <div className="flex flex-col space-y-6">
          <DeploymentDetail username={username} deployment={deployment} />
          <WithClient>
            <DeploymentLogs
              userId={sessionUser.userId}
              deploymentId={deploymentId}
            />
          </WithClient>
        </div>
      </div>
    </div>
  )
}
