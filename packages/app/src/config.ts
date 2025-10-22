export const a0BaseUrl = () => {
  return process.env.A0_BASEURL || "https://console.riverly.tech";
};

export const a0APIBaseUrl = () => {
  return process.env.A0_API_BASEURL || "https://api.riverly.tech";
};

export const a0GitHubAppID = () => {
  return process.env.A0_GITHUB_APP_ID
    ? parseInt(process.env.A0_GITHUB_APP_ID)
    : 0;
};

export const a0GitHubPrivateKeyBase64 =
  process.env.A0_GITHUB_PRIVATE_KEY_BASE64!;

export const githubClientID = process.env.GITHUB_CLIENT_ID!;
export const githubClientSecret = process.env.GITHUB_CLIENT_SECRET!;

export const a0ElectricSyncBaseUrl = () => {
  return process.env.A0_ELECTRIC_SYNC_BASEURL || "http://localhost:3001";
};

export function serverHomepage(username: string, name: string) {
  return `https://${a0BaseUrl()}/servers/${username}/${name}`;
}
