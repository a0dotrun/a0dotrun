export type LogRow = {
  log_id: string
  user_id: string
  deployment_id: string
  timestamp: string
  message: string
  level: string
  created_at: string
  updated_at: string
}

export function toDeploymentLogShape(row: LogRow) {
  return {
    logId: row.log_id,
    userId: row.user_id,
    deploymentId: row.deployment_id,
    timestamp: row.timestamp,
    message: row.message,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
