export const GitHubInstallationSetupValue = {
  INSTALL: "install",
  UPDATE: "update",
} as const;
export type GitHubInstallationSetup =
  (typeof GitHubInstallationSetupValue)[keyof typeof GitHubInstallationSetupValue];

export type GitHubRepoPermissions = {
  admin: boolean;
  maintain?: boolean;
  push: boolean;
  triage?: boolean;
  pull: boolean;
};

export type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  htmlUrl: string;
  cloneUrl: string;
  permissions?: GitHubRepoPermissions;
  owner: string;
};
