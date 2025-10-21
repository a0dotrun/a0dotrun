export const A0_API_BASEURL =
  process.env.A0_API_BASEURL || "https://api.a0.run";

export const A0_BASEURL = process.env.A0_BASEURL || "https://a0.run";

export const A0_GITHUB_APP_ID = process.env.A0_GITHUB_APP_ID
  ? parseInt(process.env.A0_GITHUB_APP_ID)
  : 0;

export const A0_ELECTRIC_SYNC_BASEURL =
  process.env.A0_ELECTRIC_SYNC_BASEURL || "http://localhost:8081";

export const A0_RESTATE_CLIENT_BASEURL =
  process.env.A0_RESTATE_CLIENT_BASEURL || "http://localhost:8080";

// ------
export const a0BaseUrl = () => {
  return process.env.A0_BASEURL || "https://a0.run";
};

export const a0APIBaseUrl = () => {
  return process.env.A0_API_BASEURL || "https://api.a0.run";
};

export const a0GitHubAppID = () => {
  return process.env.A0_GITHUB_APP_ID
    ? parseInt(process.env.A0_GITHUB_APP_ID)
    : 0;
};

export const a0APICallbackBaseUrl = () => {
  if (process.env.NODE_ENV === "production") {
    return A0_API_BASEURL;
  } else {
    return "https://localapi.a0.run";
  }
};

export const a0ElectricSyncBaseUrl = () => {
  return process.env.A0_ELECTRIC_SYNC_BASEURL || "http://localhost:3001";
};

export const a0RestateClientBaseUrl = () => {
  return process.env.A0_RESTATE_CLIENT_BASEURL || "http://localhost:8080";
};
// ------

export function serverHomepage(username: string, name: string) {
  return `https://${A0_BASEURL}/servers/${username}/${name}`;
}
