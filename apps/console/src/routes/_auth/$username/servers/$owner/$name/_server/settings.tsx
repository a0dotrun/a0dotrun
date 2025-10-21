import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute(
  '/_auth/$username/servers/$owner/$name/_server/settings',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { owner, name } = Route.useParams()
  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="h-20">
          <h1 className="text-2xl mb-2 font-mono font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Configure settings for{' '}
            <span className="font-mono font-semibold text-primary text-sm">
              {`${owner}/${name}`}
            </span>
          </p>
        </div>
        <hr className="py-4" />
        <Card className="max-w-4xl shadow-none">
          <CardContent className="font-thin">
            <p>Coming Soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
