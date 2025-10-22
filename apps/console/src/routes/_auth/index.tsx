import { createFileRoute, Link } from '@tanstack/react-router'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@/components/ui/navigation-menu'
import { Textarea } from '@/components/ui/textarea'

export const Route = createFileRoute('/_auth/')({
  component: App,
})

function App() {
  const { sessionUser } = Route.useRouteContext()
  const username = sessionUser.username
  const avatarUrl =
    sessionUser.image ?? `https://avatar.vercel.sh/${username}`
  const teams = [
    {
      username,
      name: sessionUser.name,
      avatarUrl,
    },
  ]
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-2 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="mr-1">
            <Link to="/$username" params={{ username }} className="font-mono">
              a0run/
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-1.5 pb-1">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a
                    href="https://docs.riverly.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2"
                  >
                    Docs
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <a
                    href="https://blog.riverly.tech"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2"
                  >
                    Blog
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="px-3 py-2">
                      Feedback
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Give feedback</DialogTitle>
                      <DialogDescription>
                        We&apos;d love to hear what went well or how we can
                        improve the product experience.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-2">
                      <Textarea
                        rows={4}
                        placeholder="Your feedback"
                        className="text-sm"
                      />
                      <Button>Submit</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full hover:bg-alpha-400 focus:bg-alpha-400 size-fit border-0 p-0.5"
              >
                <Avatar className="size-6">
                  <AvatarImage src={avatarUrl} alt={username} />
                  <AvatarFallback>
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{sessionUser.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/$username" params={{ username }}>
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/$username/settings" params={{ username }}>
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        <section className="flex basis-full flex-col justify-center gap-8 px-8 py-12 md:basis-1/2 md:px-12 lg:px-16">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Signed in as {sessionUser.name}
            </p>
            <h1 className="font-mono text-2xl font-semibold">Select a Team</h1>
            <p className="text-muted-foreground">
              Choose a team to continue to your dashboard.
            </p>
          </div>

          <ul className="space-y-3">
            {teams.map((team) => (
              <li key={team.username}>
                <Link
                  to="/$username"
                  params={{ username: team.username }}
                  className="bg-card text-card-foreground hover:border-primary/50 hover:bg-card/80 focus-visible:ring-ring block rounded-xl border p-4 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="size-12">
                      <AvatarImage src={team.avatarUrl} alt={team.name} />
                      <AvatarFallback className="text-lg font-medium">
                        {team.name
                          .split(' ')
                          .map((word) => word.charAt(0))
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-lg font-medium">{team.name}</span>
                      <span className="text-muted-foreground">
                        @{team.username}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <aside aria-hidden="true" className="hidden flex-1 md:block" />
      </div>
    </div>
  )
}
