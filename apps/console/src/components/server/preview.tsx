import type { UserServerView } from '@a0dotrun/app'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CheckCircle, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'

export function UserServerCard({
  username,
  server,
}: {
  username: string
  server: UserServerView
}) {
  const avatarUrl =
    server.avatarUrl || `https://avatar.vercel.sh/${server.name}`
  return (
    <Card className="gap-2 group focus:outline-none p-0 rounded-sm  flex min-h-[80px] bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 shadow-none group-focus:ring-2 group-focus:ring-zinc-400">
      <CardContent className="flex flex-col lg:flex-row gap-3 p-2 w-full h-full">
        <div className="w-20 h-20 min-w-[80px] min-h-[80px] overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 self-start">
          <img
            src={avatarUrl}
            alt={server.name}
            width={80}
            height={80}
            className="object-cover w-20 h-20"
            draggable={false}
          />
        </div>
        <div className="min-w-0 flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
            <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium truncate">
              {server.username}
            </span>
            <span className="text-sm text-zinc-400 dark:text-zinc-600">/</span>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {server.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link
                to="/$username/servers/$owner/$name"
                params={{
                  username,
                  owner: server.owner.username,
                  name: server.name,
                }}
              >
                View MCP Server
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex-1 mt-4 lg:mt-0">
          {/* <ServerMetricPreview /> */}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-4 py-2 font-mono">
        {/*<div className="flex items-center gap-1 text-xs">*/}
        {/*  <GitCommitHorizontal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />*/}
        {/*  <span className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded">*/}
        {/*    {"unknown"}*/}
        {/*  </span>*/}
        {/*</div>*/}
        <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
          <Rocket className="w-3 h-3" />
          {server.usageCount} Runs
        </div>
      </CardFooter>
    </Card>
  )
}
