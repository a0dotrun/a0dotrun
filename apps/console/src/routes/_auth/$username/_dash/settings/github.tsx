import { createFileRoute } from '@tanstack/react-router'
import { GitHubIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { userGitHubInstallationFn } from '@/funcs'

export const Route = createFileRoute('/_auth/$username/_dash/settings/github')({
  loader: async () => {
    const installation = await userGitHubInstallationFn()
    return {
      installation,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { installation } = Route.useLoaderData()
  const { username } = Route.useParams()
  return (
    <Card className="max-w-4xl shadow-none">
      <CardHeader>
        <CardTitle>GitHub Connect</CardTitle>
        <CardDescription>
          Connect your GitHub account to sync repositories and enable advanced
          features.
        </CardDescription>
      </CardHeader>
      <CardContent className="font-thin">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitHubIcon className="h-4 w-4" />
            <span className="text-sm font-medium font-mono">{username}</span>
          </div>

          {installation ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">
                  GitHub Connected
                </span>
              </div>
              <a
                href="https://github.com/apps/a0dotrun/installations/new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              >
                <span className="hidden sm:inline font-normal">
                  Adjust GitHub App permissions →
                </span>
                <span className="sm:hidden font-normal">
                  Adjust Permissions →
                </span>
              </a>
            </div>
          ) : (
            <Button
              asChild
              variant="default"
              className="gap-2 w-full sm:w-auto"
            >
              <a
                href="https://github.com/apps/a0dotrun/installations/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitHubIcon className="h-4 w-4" />
                Connect GitHub
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
