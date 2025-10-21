import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent } from '@/components/ui/card'

export const Route = createFileRoute(
  '/_auth/$username/_dash/settings/webhooks',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Card className="max-w-4xl shadow-none">
      <CardContent className="font-thin">
        <p>Coming Soon...</p>
      </CardContent>
    </Card>
  )
}
