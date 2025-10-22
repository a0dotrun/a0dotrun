'use client'

import { useShape } from '@electric-sql/react'
import * as motion from 'motion/react-client'
import type { ShapeStreamOptions } from '@electric-sql/client/'
import type { LogRow } from '@/sync/shapes'
import { toDeploymentLogShape } from '@/sync/shapes'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

const logShape = (userId: string, deploymentId: string): ShapeStreamOptions => {
  if (typeof window !== `undefined`) {
    return {
      url: new URL(`/api/sync/v1`, window.location.origin).href,
      params: {
        table: 'deployment_log',
        where: `user_id='${userId}' AND deployment_id='${deploymentId}'`,
      },
    }
  }
  throw new Error('Sync Unsupported SSR')
}

export function DeploymentLogs({
  userId,
  deploymentId,
}: {
  userId: string
  deploymentId: string
}) {
  const {
    data: logs,
    isLoading,
    isError,
  } = useShape<LogRow>(logShape(userId, deploymentId))

  if (isLoading) {
    return (
      <motion.div
        className="rounded-lg border bg-card shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="border-b bg-muted/50 px-4 py-2">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>

        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex items-start gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Skeleton className="h-3 w-16 mt-0.5" />
              <Skeleton
                className="h-3 flex-1"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    )
  }

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load deployment logs. Please try refreshing the page or
            contact support if the issue persists.
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  const sortedLogs = logs
    .map(toDeploymentLogShape)
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    )

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return timestamp
    }
  }

  return (
    <motion.div
      className="rounded-lg border bg-card shadow-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="border-b bg-muted/50 px-4 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-sm font-medium">Deployment Logs</h3>
        {logs.length > 0 && (
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {logs.length} {logs.length === 1 ? 'line' : 'lines'}
          </motion.p>
        )}
      </motion.div>

      <div className="p-0">
        {logs.length === 0 ? (
          <motion.div
            className="flex items-center justify-center h-32 text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="text-center">
              <div className="text-sm">No logs available</div>
              <div className="text-xs mt-1">
                Logs will appear here as your deployment progresses
              </div>
            </div>
          </motion.div>
        ) : (
          <ScrollArea className="h-96">
            <motion.div
              className="p-4 space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {sortedLogs.map((log, index) => (
                <motion.div
                  key={log.logId}
                  className="flex items-start gap-3 py-1 hover:bg-muted/30 rounded px-2 -mx-2 transition-colors"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.3 + index * 0.03,
                    ease: 'easeOut',
                  }}
                >
                  <div className="text-xs font-mono text-muted-foreground whitespace-nowrap mt-0.5">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div className="text-xs font-mono text-foreground flex-1 leading-relaxed break-all">
                    {log.message}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </ScrollArea>
        )}
      </div>
    </motion.div>
  )
}
