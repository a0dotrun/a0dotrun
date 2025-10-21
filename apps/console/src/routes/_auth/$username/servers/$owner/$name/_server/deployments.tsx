import { createFileRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_auth/$username/servers/$owner/$name/_server/deployments',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { username, owner, name } = Route.useParams()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-20">
          <h1 className="text-2xl mb-2 font-mono font-semibold">Deployments</h1>
          <p className="text-muted-foreground text-sm">
            Deployments for{' '}
            <span className="font-mono font-semibold text-primary text-sm">
              {`${owner}/${name}`}
            </span>
          </p>
        </div>
        <hr className="py-4" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4 shrink-0">
            <div className="flex flex-col space-y-1">
              <Link
                to="/$username/servers/$owner/$name/deployments"
                params={{ username, owner, name }}
                activeOptions={{ exact: true, includeSearch: false }}
                activeProps={{
                  className:
                    'w-full justify-start bg-accent text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
                inactiveProps={{
                  className:
                    'w-full justify-start hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
              >
                All
              </Link>
              <Link
                to="/$username/servers/$owner/$name/deployments/production"
                params={{ username, owner, name }}
                activeOptions={{ exact: true, includeSearch: false }}
                activeProps={{
                  className:
                    'w-full justify-start bg-accent text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
                inactiveProps={{
                  className:
                    'w-full justify-start hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
              >
                Production
              </Link>
              <Link
                to="/$username/servers/$owner/$name/deployments/preview"
                params={{ username, owner, name }}
                activeOptions={{ exact: true, includeSearch: false }}
                activeProps={{
                  className:
                    'w-full justify-start bg-accent text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
                inactiveProps={{
                  className:
                    'w-full justify-start hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
              >
                Preview
              </Link>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
