```ts
import { createPrivateKey } from "crypto";
import { importPKCS8, SignJWT } from "jose";

export namespace GitHub {
  export const decodeGitHubSecretKey = () => {
    const base64str = process.env.A0_GITHUB_PRIVATE_KEY_BASE64 ?? null;
    if (!base64str)
      throw new Error("A0_GITHUB_PRIVATE_KEY_BASE64 is not set for GitHub");
    return Buffer.from(base64str, "base64").toString("utf-8");
  };

  export async function gitHubGenerateJWT(
    expiry: number = 600
  ): Promise<string> {
    const ghRSAKey = decodeGitHubSecretKey();
    const ghAppId = process.env.A0_GITHUB_APP_ID;

    if (!ghAppId) {
      throw new Error("A0_GITHUB_APP_ID is not set");
    }

    // the jose library natively doesn't support PKCS#1 format
    // as we doing similar with the Go code in cbuilder module.
    // hence it needs conversion.

    try {
      const rsaKeyObject = createPrivateKey(ghRSAKey);
      const pkcs8Key = rsaKeyObject.export({
        type: "pkcs8",
        format: "pem",
      });
      const privateKey = await importPKCS8(pkcs8Key.toString(), "RS256");
      const now = Math.floor(Date.now() / 1000);
      return await new SignJWT({})
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt(now)
        .setExpirationTime(now + expiry)
        .setIssuer(ghAppId)
        .sign(privateKey);
    } catch (error) {
      throw new Error(`Failed to generate GitHub JWT: ${error}`);
    }
  }

  // Fetch the GitHub installation access token, the way it works is bit involved.
  // Must have Private RSA key along with the Public key already setup at GitHub.
  // We use the private key saved as base64 string in environment, decode the string,
  // use that to create a JWT token (using jose package here) with some expiry see `gitHubGenerateJWT`
  // pass the returned jwt to make a request to GitHub's access token endpoint with the installed ID (must be already installed.)
  // GitHub then returns the token string along with expiry.
  export async function gitHubInstalledAccessToken(
    ghInstallationId: string
  ): Promise<string> {
    const jwt = await gitHubGenerateJWT();

    const response = await fetch(
      `https://api.github.com/app/installations/${ghInstallationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
          "User-Agent": "a0run",
        },
      }
    );

    if (response.status !== 201) {
      const errorBody = await response.text();
      throw new Error(
        `GitHub API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const tokenResponse = (await response.json()) as { token: string };
    return tokenResponse.token;
  }
}
```
