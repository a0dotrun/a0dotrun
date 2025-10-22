import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth/$username/_dash/servers/_list')({
  component: RouteComponent,
})

function RouteComponent() {
  const { sessionUser } = Route.useRouteContext()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-20 flex justify-between">
          <div>
            <h1 className="text-2xl mb-2 font-mono font-semibold">Servers</h1>
            <p className="text-muted-foreground">
              Servers from {sessionUser.username} and other publicly installed
              servers.
            </p>
          </div>
          <Button size="default" asChild>
            <Link
              to="/$username/servers/new"
              params={{ username: sessionUser.username }}
            >
              Add New
            </Link>
          </Button>
        </div>
        <hr className="py-4" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4 shrink-0">
            <div className="flex flex-col space-y-1">
              <Link
                to="/$username/servers"
                params={{ username: sessionUser.username }}
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
                to="/$username/servers/private"
                params={{ username: sessionUser.username }}
                activeOptions={{ exact: false, includeSearch: false }}
                activeProps={{
                  className:
                    'w-full justify-start bg-accent text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
                inactiveProps={{
                  className:
                    'w-full justify-start hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
              >
                Private
              </Link>
              <Link
                to="/$username/servers/public"
                params={{ username: sessionUser.username }}
                activeOptions={{ exact: false, includeSearch: false }}
                activeProps={{
                  className:
                    'w-full justify-start bg-accent text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
                inactiveProps={{
                  className:
                    'w-full justify-start hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2',
                }}
              >
                Public
              </Link>
            </div>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
