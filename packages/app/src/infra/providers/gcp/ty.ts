import z from "zod/v4";
import { DeploymentStatusEnum, type DeploymentStatusType } from "../../../ty";

// Represents the Cloud Build status
// These are mapped to internal `DeploymentStatus`
export const CloudBuildStatusEnum = {
  STATUS_UNKNOWN: "STATUS_UNKNOWN",
  QUEUED: "QUEUED",
  WORKING: "WORKING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  TIMEOUT: "TIMEOUT",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
} as const;

export const CloudBuildStatus = z.enum(Object.values(CloudBuildStatusEnum));

export type CloudBuildStatus = z.infer<typeof CloudBuildStatus>;

export function toDeploymentStatusEnum(
  status: CloudBuildStatus
): DeploymentStatusType {
  switch (status) {
    case CloudBuildStatusEnum.STATUS_UNKNOWN:
    case CloudBuildStatusEnum.QUEUED:
      return DeploymentStatusEnum.PLACED;

    case CloudBuildStatusEnum.WORKING:
      return DeploymentStatusEnum.RUNNING;

    case CloudBuildStatusEnum.SUCCESS:
      return DeploymentStatusEnum.READY;

    case CloudBuildStatusEnum.FAILURE:
    case CloudBuildStatusEnum.INTERNAL_ERROR:
    case CloudBuildStatusEnum.TIMEOUT:
      return DeploymentStatusEnum.ERROR;

    case CloudBuildStatusEnum.CANCELLED:
    case CloudBuildStatusEnum.EXPIRED:
      return DeploymentStatusEnum.ABORTED;

    default:
      return DeploymentStatusEnum.ERROR;
  }
}

export function isTerminalStatus(status: CloudBuildStatus) {
  return (
    status === CloudBuildStatusEnum.SUCCESS ||
    status === CloudBuildStatusEnum.FAILURE ||
    status === CloudBuildStatusEnum.INTERNAL_ERROR ||
    status === CloudBuildStatusEnum.TIMEOUT ||
    status === CloudBuildStatusEnum.CANCELLED ||
    status === CloudBuildStatusEnum.EXPIRED
  );
}
