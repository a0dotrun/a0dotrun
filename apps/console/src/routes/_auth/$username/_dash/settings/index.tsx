import { createFileRoute } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ProfileForm } from '@/components/settings/profile-form'

export const Route = createFileRoute('/_auth/$username/_dash/settings/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { sessionUser } = Route.useRouteContext()
  return (
    <div className="flex flex-col space-y-8">
      <Card className="max-w-4xl shadow-none">
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>
            Update your name displayed on your profile and across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm defaultName={sessionUser.name} />
        </CardContent>
      </Card>
      <Card className="max-w-4xl shadow-none">
        <CardHeader>
          <CardTitle>Update other details</CardTitle>
          <CardDescription>
            Your other profile details come from your GitHub profile.
            <br />
            To change them, visit:{' '}
            <a
              href="https://github.com/settings/profile"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary"
            >
              github.com/settings/profile
            </a>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
