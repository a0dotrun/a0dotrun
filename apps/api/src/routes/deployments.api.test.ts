import { beforeAll, describe, expect, it } from "@jest/globals";
import request from "supertest";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5000";
const AUTH_TOKEN = process.env.TEST_JWT_TOKEN;

if (!AUTH_TOKEN) {
  throw new Error(
    "TEST_JWT_TOKEN environment variable must be defined to run API tests."
  );
}

const apiClient = () => request(API_BASE_URL);

const postDeployment = async (
  body: Record<string, unknown>,
  token: string | null = AUTH_TOKEN
) => {
  const req = apiClient().post("/v1/deployment").send(body);
  if (token) {
    req.set("Authorization", `Bearer ${token}`);
  }
  const res = await req;
  return { status: res.status, json: res.body };
};

describe("Deployment API validation", () => {
  const basePayload = {
    name: "example-server",
    config: {},
  };

  beforeAll(async () => {
    const res = await apiClient().get("/");
    if (res.status !== 200) {
      throw new Error(
        `Deployment API health check failed with status ${res.status}.`
      );
    }
  });

  // it("rejects requests without authorization", async () => {
  //   const { status } = await postDeployment(basePayload, null);
  //   expect(status).toBe(401);
  // });

  // it("requires exactly one of repo, artifact, or revisionId", async () => {
  //   const { status, json } = await postDeployment(basePayload);
  //   expect(status).toBe(400);
  //   expect(json?.error?.code).toBe("bad_request");
  // });

  // it("rejects payloads that provide multiple deployment sources", async () => {
  //   const payload = {
  //     ...basePayload,
  //     repo: "https://github.com/example/example",
  //     artifact: "artifact.tgz",
  //   };

  //   const { status, json } = await postDeployment(payload);
  //   expect(status).toBe(400);
  //   expect(json?.error?.code).toBe("bad_request");
  // });

  it("logs the response when attempting a GitHub repo deployment", async () => {
    const payload = {
      ...basePayload,
      name: "sanchitrk/mcping",
      repo: "https://github.com/sanchitrk/mcping",
    };

    const result = await postDeployment(payload);
    console.log("GitHub deployment attempt:", result);
    expect(result.status).not.toBe(401);
  });

  // const additionalRepos = [
  //   {
  //     name: "sanchitrk/a0ctl",
  //     repo: "https://github.com/sanchitrk/a0ctl",
  //   },
  //   {
  //     name: "sanchitrk/js-calendar",
  //     repo: "https://github.com/sanchitrk/js-calendar",
  //   },
  // ];

  // it.each(additionalRepos)(
  //   "logs response for GitHub repo deployment: %s",
  //   async ({ name, repo }) => {
  //     const payload = {
  //       ...basePayload,
  //       name,
  //       repo,
  //     };

  //     const result = await postDeployment(payload);
  //     console.log(`GitHub deployment attempt for ${name}:`, result);
  //     expect(result.status).not.toBe(401);
  //   }
  // );
});
