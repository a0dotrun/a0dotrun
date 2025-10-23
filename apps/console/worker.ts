import server from '@tanstack/react-start/server-entry'

type WorkerEnv = Cloudflare.Env

let runtimeEnvHydrated = false

const hydrateRuntimeEnv = (env: WorkerEnv) => {
  if (runtimeEnvHydrated) {
    return
  }

  // In Cloudflare Workers, we need to hydrate environment variables
  // to make them available to the process.env for the server
  const globalProcess = (globalThis as any).process
  if (!globalProcess) {
    ;(globalThis as any).process = { env: {} }
  }

  const processEnv = (globalThis as any).process.env as Record<
    string,
    string | undefined
  >
  const hyperdriveConn = env.HYPERDRIVE.connectionString
  if (hyperdriveConn) {
    processEnv.DATABASE_URL = hyperdriveConn
  }

  runtimeEnvHydrated = true
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    hydrateRuntimeEnv(env)
    return server.fetch(request)
  },
}
