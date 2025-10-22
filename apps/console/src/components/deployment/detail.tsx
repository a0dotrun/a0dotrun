import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { UserDeploymentDetail } from '@a0dotrun/app/ty'
import {
  ArrowUpCircle,
  Circle,
  GitBranch,
  GitCommitHorizontal,
  Hammer,
  Copy,
  CheckCheck,
} from 'lucide-react'
import { format } from 'date-fns'
import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { HashDisplay } from '@/components/commons/display-hash'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { Button } from '@/components/ui/button'

export function DeploymentDetail({
  username,
  deployment,
}: {
  username: string
  deployment: UserDeploymentDetail
}) {
  const avatarUrl = `https://avatar.vercel.sh/${deployment.username}`
  const createdDateLabel =
    deployment.createdAt && format(new Date(deployment.createdAt), 'MMM d')
  const domainUrl = `https://mcp.riverly.tech/${deployment.username}/${deployment.name}`
  const [copiedText, copyToClipboard] = useCopyToClipboard()
  const hasCopiedDomain = copiedText === domainUrl

  return (
    <Card className="p-4 shadow-xs">
      <div className="flex flex-col gap-1">
        <div className="font-mono text-base font-bold">{deployment.title}</div>
        <Link
          to="/$username/servers/$owner/$name"
          params={{
            username,
            owner: deployment.username,
            name: deployment.name,
          }}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
        >
          {`${deployment.username}/${deployment.name}`}
        </Link>
      </div>
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DetailSection label="Created">
            <div className="flex items-center gap-2">
              <img
                src={avatarUrl}
                alt=""
                className="h-7 w-7 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
                draggable={false}
              />
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                <span className="truncate">{username}</span>
                <span className="text-muted-foreground">
                  {createdDateLabel}
                </span>
              </div>
            </div>
          </DetailSection>

          <DetailSection label="Status">
            <div className="flex items-center gap-1">
              <Circle
                className="h-3 w-3 text-emerald-400"
                fill="currentColor"
              />
              <span className="text-sm capitalize">{deployment.status}</span>
            </div>
          </DetailSection>

          <DetailSection label="Build">
            <div className="flex items-center gap-1">
              <Hammer className="w-4 h-4 text-muted-foreground" />
              <HashDisplay
                hash={deployment.imageDigest ?? 'unknown'}
                className="font-mono border-transparent bg-blue-100 text-blue-600 dark:bg-blue-900/80 dark:text-blue-300"
              />
            </div>
          </DetailSection>

          <DetailSection label="Target">
            <div className="flex items-center gap-1">
              <ArrowUpCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">{deployment.target}</span>
              <Badge className="border-transparent bg-green-100 text-green-600 dark:bg-green-900/80 dark:text-green-300">
                {'Current'}
              </Badge>
            </div>
          </DetailSection>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DetailSection label="Domains">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(domainUrl)}
                disabled={hasCopiedDomain}
                aria-label={
                  hasCopiedDomain
                    ? 'Domain URL copied'
                    : 'Copy domain URL to clipboard'
                }
              >
                {hasCopiedDomain ? (
                  <CheckCheck className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <span className="text-sm truncate">{domainUrl}</span>
            </div>
          </DetailSection>

          <DetailSection label="Source">
            <div className="flex items-center gap-1">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{deployment.gitHubRef}</span>
            </div>
            <div className="flex items-center gap-1">
              <GitCommitHorizontal className="h-5 w-5 text-muted-foreground" />
              <HashDisplay
                hash={deployment.commitHash ?? 'unknown'}
                className="font-mono border-transparent bg-gray-100 text-gray-600 dark:bg-gray-900/80 dark:text-gray-300"
              />
            </div>
          </DetailSection>
        </div>
      </div>
    </Card>
  )
}

function DetailSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 font-mono">
        {label}
      </span>
      {children}
    </div>
  )
}
