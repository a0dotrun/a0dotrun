import type { Logger } from "pino";

// Determine the environment
const isBrowser =
  typeof globalThis !== "undefined" &&
  "window" in globalThis &&
  (globalThis as any).window !== undefined;
const isProduction =
  typeof process !== "undefined"
    ? process.env.NODE_ENV === "production"
    : false;

// Define a browser-compatible logger that implements the pino interface
interface BrowserLogger {
  trace: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  fatal: (...args: any[]) => void;
  child: (bindings?: Record<string, any>) => BrowserLogger;
  level: string;
}

function createBrowserLogger(): BrowserLogger {
  // Create a pino-like interface using console
  const logger: BrowserLogger = {
    level: isProduction ? "info" : "debug",

    trace: isProduction
      ? () => {}
      : (...args: any[]) => console.log("[TRACE]", ...args),
    debug: isProduction
      ? () => {}
      : (...args: any[]) => console.log("[DEBUG]", ...args),
    info: (...args: any[]) => console.info("[INFO]", ...args),
    warn: (...args: any[]) => console.warn("[WARN]", ...args),
    error: (...args: any[]) => console.error("[ERROR]", ...args),
    fatal: (...args: any[]) => console.error("[FATAL]", ...args),

    // Child logger function for API compatibility
    child: (bindings?: Record<string, any>) => {
      // In browser, we can prefix logs with bindings
      const childLogger = { ...logger };
      if (bindings) {
        const prefix = JSON.stringify(bindings);
        childLogger.trace = isProduction
          ? () => {}
          : (...args: any[]) => console.log("[TRACE]", prefix, ...args);
        childLogger.debug = isProduction
          ? () => {}
          : (...args: any[]) => console.log("[DEBUG]", prefix, ...args);
        childLogger.info = (...args: any[]) =>
          console.info("[INFO]", prefix, ...args);
        childLogger.warn = (...args: any[]) =>
          console.warn("[WARN]", prefix, ...args);
        childLogger.error = (...args: any[]) =>
          console.error("[ERROR]", prefix, ...args);
        childLogger.fatal = (...args: any[]) =>
          console.error("[FATAL]", prefix, ...args);
      }
      return childLogger;
    },
  };

  return logger;
}

let loggerInstance: Logger | BrowserLogger | null = null;

async function createNodeLogger(): Promise<Logger> {
  // Dynamic import pino for Node.js environment (ES modules)
  const pino = (await import("pino")).default;

  let transport: ReturnType<typeof pino.transport> | undefined;

  if (typeof pino.transport === "function") {
    try {
      const { createRequire } = await import("module");
      const require = createRequire(import.meta.url);
      const prettyTarget = require.resolve("pino-pretty");

      transport = pino.transport({
        targets: [
          {
            target: prettyTarget,
            options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
            level: "info",
          },
        ],
      });
    } catch (error) {
      console.warn(
        'Pretty logging unavailable; falling back to standard pino output.',
        error
      );
    }
  }

  return pino(
    {
      level: isProduction ? "info" : "debug",
    },
    transport
  );
}

async function initLogger(): Promise<Logger | BrowserLogger> {
  // Handle browser environment
  if (isBrowser) {
    return createBrowserLogger();
  }

  // Handle Node.js (backend) environment
  try {
    return await createNodeLogger();
  } catch (err) {
    console.error(
      "Failed to load Pino for the backend. Using console fallback.",
      err
    );
    return createBrowserLogger();
  }
}

// Initialize the logger asynchronously
const loggerPromise = initLogger().then((logger) => {
  loggerInstance = logger;
  return logger;
});

function getLogger(): Logger | BrowserLogger {
  // Return the existing instance if it has already been created
  if (loggerInstance) {
    return loggerInstance;
  }

  // If not initialized yet, return a temporary console logger
  // This shouldn't happen in practice since we initialize at module load
  console.warn("Logger not yet initialized, using temporary console logger");
  return createBrowserLogger();
}

// Export both sync and async getters
export default getLogger;
export { getLogger, loggerPromise };
export type { Logger, BrowserLogger };
