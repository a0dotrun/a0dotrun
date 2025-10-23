import { Link, createFileRoute } from '@tanstack/react-router'
import { ExplorePlatform } from '@/components/dash/explore-platform'
import {
  activeServerCountFn,
  deploymentsFn,
  recentlyViewedServersFn,
  topUsedServersFn,
} from '@/funcs'
import { Button } from '@/components/ui/button'
import { DeploymentPreview } from '@/components/deployment/preview'
import { Card, CardContent } from '@/components/ui/card'
import { GitHubSelectRepo } from '@/components/commons/github-select-repo'

export const Route = createFileRoute('/_auth/$username/_dash/')({
  loader: async ({ context }) => {
    const activeServerCount = await activeServerCountFn({
      data: { userId: context.sessionUser.userId },
    })
    const topUsedServers = await topUsedServersFn({
      data: { userId: context.sessionUser.userId, limit: 3 },
    })
    const recentlyViewedServers = await recentlyViewedServersFn({
      data: {
        userId: context.sessionUser.userId,
        limit: 3,
      },
    })
    const deployments = await deploymentsFn({
      data: {
        userId: context.sessionUser.userId,
        limit: 3,
        target: 'all',
      },
    })
    return {
      activeServerCount,
      topUsedServers,
      recentlyViewedServers,
      deployments,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { sessionUser } = Route.useRouteContext()
  const { deployments } = Route.useLoaderData()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-20">
          <h1 className="text-2xl mb-2 font-mono font-semibold">
            Welcome to Riverly!
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Give us a shout on Discord or X if you get stuck along the way!
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-3/4 lg:w-3/5">
            <div className="flex flex-col space-y-4">
              {deployments.length > 0 ? (
                <div className="flex flex-col space-y-4">
                  <h2 className="text-sm mb-4 font-semibold">
                    Recent Deployments
                  </h2>
                  <div className="flex flex-col space-y-2">
                    {deployments.map((deployment) => (
                      <DeploymentPreview
                        key={deployment.deploymentId}
                        deployment={deployment}
                      />
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button size="sm" asChild variant="outline">
                      <Link
                        to="/$username/deployments"
                        params={{ username: sessionUser.username }}
                      >
                        View More
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <Card className="shadow-xs">
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      <p className="text-lg font-semibold">
                        Deploy your first MCP Server
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Start with one of our example MCP servers or create
                        something new.
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <GitHubSelectRepo username={sessionUser.username} />

                      {/* <div className="flex flex-col space-y-2">
                        {tryForFreeServers.map((server) => {
                          return (
                            <ServerCard key={server.serverId} server={server} />
                          );
                        })}
                      </div> */}
                    </div>

                    <div className="border-t pt-6">
                      {/* <Button variant="default" asChild>
                        <Link href={"/collections/try-now/server"}>
                          Explore More
                        </Link>
                      </Button> */}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          <div className="w-full flex flex-col md:w-1/4 lg:w-2/5">
            <ExplorePlatform />
          </div>
        </div>
      </div>
    </div>
  )
}
