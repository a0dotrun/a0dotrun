import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { Globe, Rocket, Scale } from 'lucide-react'
import { ServerVisibilityEnum } from '@a0dotrun/app/ty'
import { CopyableCodeBlock } from '@/components/commons/copyable-code-block'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExplorePlatform } from '@/components/dash/explore-platform'
import { getServerConfigFn, getServerFromNameFn } from '@/funcs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GitHubIcon } from '@/components/icons/icons'

export const Route = createFileRoute(
  '/_auth/$username/servers/$owner/$name/_server/',
)({
  loader: async ({ params }) => {
    const { owner, name } = params

    const server = await getServerFromNameFn({
      data: {
        username: owner,
        name,
      },
    })
    if (!server) throw notFound()

    const serverConfig = await getServerConfigFn({
      data: { serverId: server.serverId },
    })

    return {
      server,
      serverConfig,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { server } = Route.useLoaderData()
  const { username, owner, name } = Route.useParams()
  const serverAvatarUrl =
    server.avatarUrl || `https://avatar.vercel.sh/${server.name}`

  const githubUrl =
    server.visibility === ServerVisibilityEnum.PUBLIC
      ? `https://github.com/${server.username}/${server.name}`
      : null

  const visibilityLabels: Record<string, string> = {
    [ServerVisibilityEnum.PUBLIC]: 'Public',
    [ServerVisibilityEnum.PRIVATE]: 'Private',
  }
  const formattedVisibility =
    visibilityLabels[server.visibility] || server.visibility

  // const typeScriptSnippet = createTypeScriptSnippet({
  //   gatewayUrl,
  //   serverIdentifier,
  //   config,
  //   envs,
  // })

  // const pythonSnippet = createPythonSnippet({
  //   gatewayUrl,
  //   serverIdentifier,
  //   config,
  //   envs,
  // })

  // const jsonSnippet = createJsonSnippet({
  //   gatewayUrl,
  //   serverIdentifier,
  //   config,
  //   envs,
  //   revision,
  // })

  const typeScriptSnippet = `TS Code!!`
  const pythonSnippet = `Python Code!!`
  const jsonSnippet = `JSON Code!!`

  const isReady = false

  return (
    <div className="py-12 px-4">
      <div className="flex flex-col max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
          {/* column 1, and 2 - full width on mobile, 2/3 on larger screens */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={serverAvatarUrl} alt={server.name} />
                <AvatarFallback className="text-xl">
                  {server.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-3xl">
                <Link
                  to="/users/$username"
                  params={{ username: server.username }}
                  className="text-muted-foreground underline decoration-1 hover:decoration-2 underline-offset-4"
                >
                  {server.username}
                </Link>
                <span className="mx-1 text-muted-foreground">/</span>
                <span className="text-primary">{server.name}</span>
              </div>
            </div>

            <p className="py-4 text-wrap max-w-2xl line-clamp-3">
              {server.description}
            </p>

            <div className="flex flex-wrap gap-4 text-sm font-thin font-mono">
              <div className="flex items-center gap-1.5 capitalize">
                <Globe className="w-4 h-4" />
                {formattedVisibility}
              </div>
              <div className="flex items-center gap-1.5">
                <Rocket className="w-4 h-4" />
                <span className="font-mono">{server.usageCount}</span>Runs
              </div>
            </div>
          </div>

          {/* column 3 - full width on mobile, 1/3 on larger screens */}
          <div className="col-span-1">
            <div className="flex flex-col space-y-2 sm:py-3">
              {/* {session ? (
                  <ConnectCurrentOrDeploy />
                ) : (
                  <Button asChild size="default" className="w-full">
                    <Link href="/login">Login to Generate URL</Link>
                  </Button>
                )} */}
              <div className="flex flex-wrap gap-2">
                {server.visibility === ServerVisibilityEnum.PUBLIC &&
                  server.license && (
                    <div className="flex-1 min-w-0 px-4 py-1 border-b text-sm gap-3 flex items-center h-9 has-[>svg]:px-3 justify-center">
                      <Scale className="w-4 h-4" />
                      <span>{server.license.name ?? 'Unlicense'}</span>
                    </div>
                  )}
                {githubUrl && (
                  <Button asChild variant="outline" className="flex-1 min-w-0">
                    <a href={githubUrl} target="_blank">
                      <GitHubIcon className="w-4 h-4 mr-2" />
                      <span>GitHub</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex flex-col gap-8 w-full lg:w-2/3">
            <div className="relative">
              <Tabs
                defaultValue="typescript"
                className={`relative w-full ${isReady ? '' : 'pointer-events-none'}`}
              >
                <TabsList className="grid h-auto w-full grid-cols-3 gap-3 bg-transparent p-0 mb-6">
                  <TabsTrigger
                    value="typescript"
                    className="flex flex-col items-start justify-between h-24 bg-transparent border rounded-[13px] hover:cursor-pointer hover:bg-neutral-50/50 transition-all duration-100 data-[state=active]:border-orange-400 data-[state=active]:ring-2 data-[state=active]:ring-orange-200 data-[state=active]:bg-transparent p-3 ring-offset-0"
                  >
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="24" height="24" rx="4" fill="#3178C6" />
                      <path d="M13.5 16.5V18H18V16.5H13.5Z" fill="white" />
                      <path
                        d="M13.5 12H15V16.5H16.5V12H18V10.5H13.5V12Z"
                        fill="white"
                      />
                      <path
                        d="M8.25 15.75C8.25 16.1642 8.58579 16.5 9 16.5H10.5V15H9.75V13.5H10.5V12H9C8.58579 12 8.25 12.3358 8.25 12.75V15.75Z"
                        fill="white"
                      />
                      <path
                        d="M6 15.75C6 15.75 6 12.75 6 12.75C6 11.5074 7.00736 10.5 8.25 10.5H10.5C11.7426 10.5 12.75 11.5074 12.75 12.75V15.75C12.75 16.9926 11.7426 18 10.5 18H8.25C7.00736 18 6 16.9926 6 15.75Z"
                        fill="white"
                      />
                    </svg>
                    <p className="text-sm font-medium select-none z-[1]">
                      TypeScript
                    </p>
                  </TabsTrigger>
                  <TabsTrigger
                    value="python"
                    className="flex flex-col items-start justify-between h-24 bg-transparent border rounded-[13px] hover:cursor-pointer hover:bg-neutral-50/50 transition-all duration-100 data-[state=active]:border-orange-400 data-[state=active]:ring-2 data-[state=active]:ring-orange-200 data-[state=active]:bg-transparent p-3 ring-offset-0"
                  >
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.03v-2.867s-.109-3.42 3.35-3.42h5.766s3.24.052 3.24-3.148V3.202S18.28 0 11.913 0zM8.84 1.922a1.022 1.022 0 110 2.044 1.022 1.022 0 010-2.044z"
                        fill="#3776AB"
                      />
                      <path
                        d="M12.087 24c6.092 0 5.712-2.656 5.712-2.656l-.007-2.752h-5.814v-.826h8.121s3.9.445 3.9-5.735c0-6.18-3.403-5.96-3.403-5.96h-2.03v2.867s.109 3.42-3.35 3.42h-5.766s-3.24-.052-3.24 3.148v5.292S5.72 24 12.087 24zm3.074-1.922a1.022 1.022 0 110-2.044 1.022 1.022 0 010 2.044z"
                        fill="#FFD43B"
                      />
                    </svg>
                    <p className="text-sm font-medium select-none z-[1]">
                      Python
                    </p>
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    className="flex flex-col items-start justify-between h-24 bg-transparent border rounded-[13px] hover:cursor-pointer hover:bg-neutral-50/50 transition-all duration-100 data-[state=active]:border-orange-400 data-[state=active]:ring-2 data-[state=active]:ring-orange-200 data-[state=active]:bg-transparent p-3 ring-offset-0"
                  >
                    <svg
                      className="w-7 h-7"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 8.5C3.88071 8.5 5 7.38071 5 6C5 4.61929 3.88071 3.5 2.5 3.5C1.11929 3.5 0 4.61929 0 6C0 7.38071 1.11929 8.5 2.5 8.5Z"
                        fill="#333"
                      />
                      <path
                        d="M0 18C0 19.3807 1.11929 20.5 2.5 20.5C3.88071 20.5 5 19.3807 5 18C5 16.6193 3.88071 15.5 2.5 15.5C1.11929 15.5 0 16.6193 0 18Z"
                        fill="#333"
                      />
                      <path
                        d="M6.5 12C6.5 13.3807 7.61929 14.5 9 14.5C10.3807 14.5 11.5 13.3807 11.5 12C11.5 10.6193 10.3807 9.5 9 9.5C7.61929 9.5 6.5 10.6193 6.5 12Z"
                        fill="#333"
                      />
                      <path
                        d="M15 14.5C16.3807 14.5 17.5 13.3807 17.5 12C17.5 10.6193 16.3807 9.5 15 9.5C13.6193 9.5 12.5 10.6193 12.5 12C12.5 13.3807 13.6193 14.5 15 14.5Z"
                        fill="#333"
                      />
                      <path
                        d="M21.5 20.5C22.8807 20.5 24 19.3807 24 18C24 16.6193 22.8807 15.5 21.5 15.5C20.1193 15.5 19 16.6193 19 18C19 19.3807 20.1193 20.5 21.5 20.5Z"
                        fill="#333"
                      />
                      <path
                        d="M21.5 8.5C22.8807 8.5 24 7.38071 24 6C24 4.61929 22.8807 3.5 21.5 3.5C20.1193 3.5 19 4.61929 19 6C19 7.38071 20.1193 8.5 21.5 8.5Z"
                        fill="#333"
                      />
                      <path
                        d="M4 6H5.5C5.5 8.76142 7.73858 11 10.5 11H11.5V9.5"
                        stroke="#333"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M4 18H5.5C5.5 15.2386 7.73858 13 10.5 13H11.5V14.5"
                        stroke="#333"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M20 6H18.5C18.5 8.76142 16.2614 11 13.5 11H12.5V9.5"
                        stroke="#333"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M20 18H18.5C18.5 15.2386 16.2614 13 13.5 13H12.5V14.5"
                        stroke="#333"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                    <p className="text-sm font-medium select-none z-[1]">
                      JSON
                    </p>
                  </TabsTrigger>
                </TabsList>
                <div className="rounded-2xl overflow-hidden">
                  <div className="relative">
                    <TabsContent
                      value="typescript"
                      className="space-y-6 min-h-[600px]"
                    >
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            Installation
                          </h3>
                          <CopyableCodeBlock code="npm install @modelcontextprotocol/sdk" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Usage</h3>
                          <CopyableCodeBlock
                            language="typescript"
                            code={typeScriptSnippet}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent
                      value="python"
                      className="space-y-6 min-h-[600px]"
                    >
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            Installation
                          </h3>
                          <CopyableCodeBlock code='pip install "mcp[cli]"' />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold mb-3">Usage</h3>
                          <CopyableCodeBlock
                            language="python"
                            code={pythonSnippet}
                          />
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent
                      value="json"
                      className="space-y-6 min-h-[600px]"
                    >
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-semibold mb-3">
                            Configuration
                          </h3>
                          <CopyableCodeBlock
                            language="json"
                            code={jsonSnippet}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
              {!isReady ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background/40 via-background/70 to-background">
                  <Button
                    asChild
                    className="rounded-2xl px-14 py-7 text-lg font-semibold font-mono tracking-tight"
                  >
                    <Link
                      to="/$username/servers/$owner/$name/deploy"
                      params={{ username, owner, name }}
                    >
                      Deploy
                    </Link>
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="w-full lg:w-1/3">
            <ExplorePlatform className="lg:sticky lg:top-24" />
          </div>
        </div>
        {/* {session && server && <ServerViewedTrack serverId={server.serverId} />} */}
      </div>
    </div>
  )
}

// function normalizeBaseUrl(url: string): string {
//   return url.endsWith('/') ? url.slice(0, -1) : url
// }

// function stringifyForCode(value: unknown): string {
//   const serialized = JSON.stringify(value)
//   return serialized === undefined ? '""' : serialized
// }

// function pythonLiteral(value: unknown): string {
//   if (value === null) return 'None'
//   if (typeof value === 'boolean') return value ? 'True' : 'False'
//   if (typeof value === 'number') return String(value)
//   const serialized = JSON.stringify(value)
//   return serialized === undefined ? '""' : serialized
// }

// function toCamelCase(input: string): string {
//   return input
//     .toLowerCase()
//     .replace(/[_-](\w)/g, (_, char: string) => char.toUpperCase())
//     .replace(/^\w/, (char) => char.toLowerCase())
// }

// function createTypeScriptSnippet({
//   gatewayUrl,
//   serverIdentifier,
//   config,
//   envs,
// }: {
//   gatewayUrl: string
//   serverIdentifier: string
//   config: Record<string, unknown>
//   envs: MCPServerConfigTable['envs']
// }) {
//   const configEntries = Object.entries(config)
//   const envEntries = envs ?? []
//   const lines: string[] = [
//     'import { Client } from "@modelcontextprotocol/sdk/client/index.js";',
//     'import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamable-http-client.js";',
//     '',
//     `const serverUrl = new URL("${gatewayUrl}");`,
//   ]

//   if (configEntries.length) {
//     configEntries.forEach(([key, value]) => {
//       lines.push(
//         `serverUrl.searchParams.set("${key}", ${stringifyForCode(value)});`,
//       )
//     })
//   } else {
//     lines.push(
//       '// Add serverUrl.searchParams.set("<key>", "<value>") if your server expects query parameters.',
//     )
//   }

//   if (envEntries.length) {
//     lines.push('', '// Load any secrets required for authentication.')
//     envEntries.forEach((env) => {
//       const varName = toCamelCase(env.name)
//       lines.push(
//         `const ${varName} = process.env.${env.name};`,
//         `if (!${varName}) {`,
//         `  throw new Error("Missing ${env.name} environment variable");`,
//         `}`,
//       )
//     })
//     lines.push(
//       '// Attach these secrets to the request where your server expects them (query params, headers, etc.).',
//     )
//   }

//   lines.push(
//     '',
//     'const transport = new StreamableHTTPClientTransport(serverUrl.toString());',
//     'const client = new Client({',
//     '  name: "My App",',
//     '  version: "1.0.0",',
//     '});',
//     '',
//     'await client.connect(transport);',
//     'const tools = await client.listTools();',
//     `console.log("Available tools for ${serverIdentifier}:", tools.map((tool) => tool.name));`,
//   )

//   return lines.join('\n')
// }

// function createPythonSnippet({
//   gatewayUrl,
//   serverIdentifier,
//   config,
//   envs,
// }: {
//   gatewayUrl: string
//   serverIdentifier: string
//   config: Record<string, unknown>
//   envs: MCPServerConfigTable['envs']
// }) {
//   const configEntries = Object.entries(config)
//   const envEntries = envs ?? []

//   const lines: string[] = [
//     ...(envEntries.length ? ['import os'] : []),
//     'import asyncio',
//     'from urllib.parse import urlencode',
//     'from mcp import ClientSession',
//     'from mcp.client.streamable_http import streamable_http_client',
//     '',
//     'async def main():',
//     `    base_url = "${gatewayUrl}"`,
//   ]

//   if (configEntries.length) {
//     lines.push('    params = {')
//     configEntries.forEach(([key, value]) => {
//       lines.push(`        "${key}": ${pythonLiteral(value)},`)
//     })
//     lines.push('    }')
//   } else {
//     lines.push(
//       '    params = {}  # Add query parameters if your server requires them',
//     )
//   }

//   if (envEntries.length) {
//     lines.push('', '    secrets = {')
//     envEntries.forEach((env) => {
//       lines.push(`        "${env.name}": os.environ.get("${env.name}"),`)
//     })
//     lines.push(
//       '    }',
//       '    missing = [name for name, value in secrets.items() if not value]',
//       '    if missing:',
//       '        raise RuntimeError(f"Set the required environment variables: {", ".join(missing)}")',
//       '    # Attach these secrets where your server expects them (query params, headers, etc.).',
//     )
//   }

//   if (configEntries.length) {
//     lines.push('    url = f"{base_url}?{urlencode(params)}"')
//   } else {
//     lines.push('    url = base_url')
//   }

//   lines.push(
//     '    async with streamable_http_client(url) as (read, write, _):',
//     '        async with ClientSession(read, write) as session:',
//     '            await session.initialize()',
//     '            tools = await session.list_tools()',
//     `            print("Available tools for ${serverIdentifier}:", [tool.name for tool in tools])`,
//     '',
//     'if __name__ == "__main__":',
//     '    asyncio.run(main())',
//   )

//   return lines.join('\n')
// }

// function createJsonSnippet({
//   gatewayUrl,
//   serverIdentifier,
//   config,
//   envs,
//   revision,
// }: {
//   gatewayUrl: string
//   serverIdentifier: string
//   config: Record<string, unknown>
//   envs: MCPServerConfigTable['envs']
//   revision?: string | null
// }) {
//   const payload: Record<string, unknown> = {
//     server: serverIdentifier,
//     gatewayUrl,
//   }

//   if (revision) {
//     payload.revision = revision
//   }

//   if (Object.keys(config).length > 0) {
//     payload.inputs = config
//   }

//   if ((envs ?? []).length > 0) {
//     payload.environment = Object.fromEntries(
//       (envs ?? []).map((env) => [
//         env.name,
//         env.secret ? '<secret>' : env.value,
//       ]),
//     )
//   }

//   return JSON.stringify(payload, null, 2)
// }
