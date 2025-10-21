import { HashDisplay } from '@/components/commons/display-hash'
import { Card, CardContent } from '@/components/ui/card'
import {
  deploymentStatusColors,
  getVerboseStatusName,
} from '@/components/utils'
import type { DeploymentPreview } from '@a0dotrun/app/ty'
import { formatDistanceToNow } from 'date-fns'
import { CheckCircle, GitCommitHorizontal } from 'lucide-react'
import { Link } from '@tanstack/react-router'

export function DeploymentPreview({
  deployment,
}: {
  deployment: DeploymentPreview
}) {
  const avatarUrl =
    deployment.avatarUrl || `https://avatar.vercel.sh/${deployment.name}`
  return (
    <Link
      key={deployment.deploymentId}
      to="/$username/deployments/$deploymentId"
      params={{ username: deployment.username, deploymentId: deployment.deploymentId }}
      className="group focus:outline-none"
      tabIndex={0}
    >
      <Card className="p-0 rounded-sm flex bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 shadow-none group-focus:ring-2 group-focus:ring-zinc-400">
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 p-2 w-full">
          {/* Column 1: Server Image, Name and Status */}
          <div className="flex gap-3">
            <div className="w-20 h-20 min-w-[80px] min-h-[80px] overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
              <img
                src={avatarUrl}
                alt=""
                width={80}
                height={80}
                className="object-cover w-20 h-20"
                draggable={false}
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium truncate">
                  {deployment.username}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  /
                </span>
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {deployment.name}
                </span>
              </div>
              <div
                className={`flex items-center gap-1 text-xs ${deploymentStatusColors[deployment.status]}`}
              >
                <div className="w-2 h-2 rounded-full bg-current" />
                {getVerboseStatusName(deployment.status)}
              </div>
            </div>
          </div>

          {/* Column 2: Commit Hash */}
          <div className="flex items-center">
            <div className="flex items-center gap-1 text-xs">
              <GitCommitHorizontal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <HashDisplay
                hash={deployment.imageDigest ?? 'unknown'}
                className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded"
              />
            </div>
          </div>

          {/* Column 3: Created Date */}
          <div className="col-span-2 md:col-span-1 flex items-center">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDistanceToNow(deployment.createdAt, { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
