import { DeploymentStatusEnum } from '@a0dotrun/app/ty'
import type { DeploymentStatusType } from '@a0dotrun/app/ty'

export const deploymentStatusColors: Record<DeploymentStatusType, string> = {
  [DeploymentStatusEnum.PENDING]: 'text-gray-500 dark:text-gray-400',
  [DeploymentStatusEnum.PLACED]: 'text-gray-500 dark:text-gray-400',
  [DeploymentStatusEnum.RUNNING]: 'text-blue-500 dark:text-blue-400',
  [DeploymentStatusEnum.READY]: 'text-emerald-500 dark:text-emerald-400',
  [DeploymentStatusEnum.ERROR]: 'text-red-500 dark:text-red-400',
  [DeploymentStatusEnum.ABORTED]: 'text-yellow-600 dark:text-yellow-400',
}

export function getVerboseStatusName(s: DeploymentStatusType): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
