import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_auth/$username/_dash/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { username } = Route.useParams()
  
  const settingsLinks = [
    {
      id: 1,
      to: "/$username/settings",
      name: "General",
    },
    {
      id: 2,
      to: "/$username/settings/github",
      name: "GitHub",
    },
    {
      id: 3,
      to: "/$username/settings/webhooks",
      name: "Webhooks",
    },
  ]

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-14">
          <h1 className="text-2xl mb-2 font-mono font-semibold">Settings</h1>
        </div>
        <hr className="py-4" />
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/4">
            <div className="flex flex-col space-y-1">
              {settingsLinks.map((link) => (
                <Button
                  key={link.id}
                  asChild
                  variant="ghost"
                  className="w-full justify-start"
                >
                  <Link
                    to={link.to}
                    params={{ username }}
                    activeProps={{
                      className: "bg-accent",
                    }}
                    activeOptions={{
                      exact: true,
                    }}
                  >
                    {link.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-col space-y-4 w-full md:w-3/4">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
