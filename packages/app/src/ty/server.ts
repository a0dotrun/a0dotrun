import z from "zod/v4";

export const ServerModeEnum = {
  REMOTE: "remote",
  LOCAL: "local",
} as const;


export const ServerTransportEnum = {
  HTTP: "http",
  STDIO: "stdio",
} as const;

export const ServerVisibilityEnum = {
  PUBLIC: "public",
  PRIVATE: "private",
} as const;

export const ServerMode = z.enum(Object.values(ServerModeEnum));
export const ServerTransport = z.enum(Object.values(ServerTransportEnum));
export const ServerVisibility = z.enum(Object.values(ServerVisibilityEnum));

export type ServerMode = z.infer<typeof ServerMode>;
export type ServerTransport = z.infer<typeof ServerTransport>;
export type ServerVisibility = z.infer<typeof ServerVisibility>;

export const EnvsSchema = z.array(
  z.object({
    name: z.string(),
    value: z.string(),
    secret: z.boolean().optional().default(false),
  })
);
export type Envs = z.infer<typeof EnvsSchema>;

export const ServerConfigSchema = z.record(z.string(), z.any());
export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export const MCPToolArgumentSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "object", "array"]), // extend as needed
  desc: z.string().optional(),
  optional: z.boolean().optional(),
});

export const MCPToolAnnotationsSchema = z.object({
  title: z.string().optional(),
  readOnlyHint: z.boolean().optional(),
  destructiveHint: z.boolean().optional(),
  idempotentHint: z.boolean().optional(),
  openWorldHint: z.boolean().optional(),
});

export const ServerReadmeSchema = z.object({
  s3Url: z.url().optional(),
  sha: z.string().optional(),
  gitHtmlUrl: z.url().optional(),
  gitUrl: z.url().optional(),
  gitDownloadUrl: z.url().optional(),
});

export type ServerReadme = z.infer<typeof ServerReadmeSchema>;

export const ServerLicenseSchema = z.object({
  name: z.string(),
});

export type ServerLicense = z.infer<typeof ServerLicenseSchema>;
