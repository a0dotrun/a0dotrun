### CB Log Polling

```typescript
    async *streamLogs(
      options: CloudBuildLogStreamOptions
    ): AsyncGenerator<CloudBuildLogEvent> {
      const gcpConfig = gcpConfigSchema.parse({});
      const gcpBuildConfig = gcpCloudBuildConfigSchema.parse({});
      const targetBuildId =
        normalizeBuildId(options.buildId) ?? options.buildId;

      if (!targetBuildId) {
        return;
      }
      const pollInterval =
        options.pollIntervalMs && options.pollIntervalMs > 0
          ? options.pollIntervalMs
          : 5_000;
      const timeoutMs =
        options.timeoutMs && options.timeoutMs > 0
          ? options.timeoutMs
          : gcpBuildConfig.maxTimeoutSeconds * 1_000;
      const deadline = Date.now() + timeoutMs;
      const loggingClient = new Logging({
        projectId: gcpConfig.GCP_PROJECT_ID,
      });
      const cloudBuildClient = new CloudBuildClient();
      const seen = new Set<string>();
      const filterParts = [
        'resource.type="build"',
        `resource.labels.build_id="${targetBuildId}"`,
      ];

      if (options.stepName) {
        filterParts.push(`jsonPayload.step.name="${options.stepName}"`);
      }

      const filter = filterParts.join(" AND ");
      let currentStatus: CloudBuildStatus = CloudBuildStatusEnum.STATUS_UNKNOWN;

      try {
        while (Date.now() <= deadline) {
          let entries: Entry[] = [];
          try {
            [entries] = await loggingClient.getEntries({
              filter,
              orderBy: "timestamp asc",
            });
          } catch (error: unknown) {
            console.warn(
              "Failed to fetch Cloud Build log entries",
              toError(error)
            );
          }

          for (const entry of entries) {
            const entryViews = getEntryViews(entry);
            const { message, stepName, severity, timestamp, logId } =
              extractEntryDetails(entryViews, entry.data);

            const dedupeKey =
              logId ?? extractEntryKey(entryViews, message, entry.data);
            if (dedupeKey && seen.has(dedupeKey)) continue;
            if (dedupeKey) {
              seen.add(dedupeKey);
            }

            if (!message) continue;
            if (isAuditLogEnvelope(message)) continue;
            yield {
              type: "log",
              message,
              stepName,
              severity,
              timestamp,
              logId,
            };
          }

          try {
            const [build] = await cloudBuildClient.getBuild({
              projectId: gcpConfig.GCP_PROJECT_ID,
              id: targetBuildId,
            });
            currentStatus = normalizeBuildStatus(build?.status);

            if (TERMINAL_STATUSES.has(currentStatus)) {
              yield { type: "status", status: currentStatus };
              return;
            }
          } catch (error: unknown) {
            if (!isGrpcNotFoundError(error)) {
              throw error;
            }
          }

          const timeRemaining = deadline - Date.now();
          if (timeRemaining <= 0) {
            break;
          }

          await delay(Math.min(pollInterval, timeRemaining));
        }

        if (!TERMINAL_STATUSES.has(currentStatus)) {
          yield { type: "timeout" };
        }
      } finally {
        await cloudBuildClient.close().catch(() => undefined);
      }
    },
```

#### Helpers

```ts
const TERMINAL_STATUSES: ReadonlySet<CloudBuildStatus> = new Set([
  CloudBuildStatusEnum.SUCCESS,
  CloudBuildStatusEnum.FAILURE,
  CloudBuildStatusEnum.INTERNAL_ERROR,
  CloudBuildStatusEnum.TIMEOUT,
  CloudBuildStatusEnum.CANCELLED,
  CloudBuildStatusEnum.EXPIRED,
]);

function isAuditLogEnvelope(message: string): boolean {
  if (!message.startsWith("{") || !message.includes("type.googleapis.com")) {
    return false;
  }
  try {
    const parsed = JSON.parse(message) as {
      type_url?: string;
      value?: unknown;
    };
    return (
      parsed.type_url === "type.googleapis.com/google.cloud.audit.AuditLog"
    );
  } catch {
    return false;
  }
}

function extractEntryKey(
  views: EntryViews,
  fallbackMessage?: string,
  rawData?: unknown
): string | null {
  const logId = extractLogId(views);
  if (logId) return logId;

  const timestampSource =
    (views.json?.["timestamp"] as unknown) ??
    (views.structured?.["timestamp"] as unknown) ??
    (views.json?.["receiveTimestamp"] as unknown) ??
    (views.structured?.["receiveTimestamp"] as unknown);
  const serializedTimestamp = serializeTimestamp(
    timestampSource as
      | string
      | Date
      | {
          seconds?: number | string | Long | null;
          nanos?: number | string | Long | null;
        }
      | undefined
  );
  if (!serializedTimestamp) return null;

  let dataSnippet =
    asNonEmptyString(fallbackMessage) ??
    getStringFromRecord(views.json, "textPayload") ??
    getStringFromRecord(views.structured, "textPayload") ??
    getStringFromRecord(views.json, "message") ??
    getStringFromRecord(views.structured, "message");

  if (!dataSnippet) {
    if (typeof rawData === "string") {
      dataSnippet = rawData;
    } else if (rawData !== undefined) {
      try {
        dataSnippet = JSON.stringify(rawData);
      } catch {
        dataSnippet = "";
      }
    }
  }

  if (!dataSnippet) dataSnippet = "";

  return `${serializedTimestamp}:${dataSnippet.slice(0, 64)}`;
}

function getEntryViews(entry: Entry): EntryViews {
  return {
    json: safeEntryJson(entry),
    structured: safeEntryStructured(entry),
  };
}

function extractEntryDetails(
  views: EntryViews,
  rawData: unknown
): {
  message?: string;
  stepName?: string;
  severity?: string;
  timestamp?: Date;
  logId?: string;
} {
  const { json, structured } = views;

  const severity =
    getStringFromRecord(json, "severity") ??
    getStringFromRecord(structured, "severity");

  const timestampSource =
    (json?.["timestamp"] as unknown) ??
    (structured?.["timestamp"] as unknown) ??
    (json?.["receiveTimestamp"] as unknown) ??
    (structured?.["receiveTimestamp"] as unknown);
  const timestamp = parseTimestamp(
    timestampSource as
      | string
      | Date
      | {
          seconds?: number | string | Long | null;
          nanos?: number | string | Long | null;
        }
      | undefined
  );

  const logId = extractLogId(views);

  let rawMessage: string | undefined;
  const considerMessage = (candidate: unknown) => {
    const value = asNonEmptyString(candidate);
    if (!rawMessage && value) {
      rawMessage = value;
    }
  };

  let stepName: string | undefined;
  const considerStep = (candidate: unknown) => {
    const value = asNonEmptyString(candidate);
    if (!stepName && value) {
      stepName = value;
    }
  };

  considerMessage(getStringFromRecord(structured, "message"));
  considerMessage(getStringFromRecord(structured, "textPayload"));
  considerMessage(getStringFromRecord(json, "message"));
  considerMessage(getStringFromRecord(json, "textPayload"));

  considerMessage(
    getStringFromRecord(structured, "logging.googleapis.com/message")
  );
  considerMessage(getStringFromRecord(json, "logging.googleapis.com/message"));

  const structuredPayload = asRecord(structured?.["jsonPayload"]);
  if (structuredPayload) {
    considerMessage(getStringFromRecord(structuredPayload, "message"));
    considerMessage(getStringFromRecord(structuredPayload, "text"));
    const step = asRecord(structuredPayload["step"]);
    if (step) {
      considerStep(getStringFromRecord(step, "name"));
    }
  }

  const jsonPayload = asRecord(json?.["jsonPayload"]);
  if (jsonPayload) {
    considerMessage(getStringFromRecord(jsonPayload, "message"));
    considerMessage(getStringFromRecord(jsonPayload, "text"));
    const step = asRecord(jsonPayload["step"]);
    if (step) {
      considerStep(getStringFromRecord(step, "name"));
    }
  }

  const normalizedData = normalizeEntryData(rawData);
  if (typeof normalizedData === "string") {
    considerMessage(normalizedData);
  } else if (
    normalizedData &&
    typeof normalizedData === "object" &&
    !Array.isArray(normalizedData)
  ) {
    const normalizedRecord = normalizedData as Record<string, unknown>;
    considerMessage(getStringFromRecord(normalizedRecord, "message"));
    considerMessage(getStringFromRecord(normalizedRecord, "text"));
    const step = asRecord(normalizedRecord["step"]);
    if (step) {
      considerStep(getStringFromRecord(step, "name"));
    }
    if (!rawMessage) {
      try {
        const serialized = JSON.stringify(normalizedRecord);
        if (serialized) {
          considerMessage(serialized);
        }
      } catch {
        // ignore serialization issues
      }
    }
  }

  if (!rawMessage && typeof rawData === "string") {
    considerMessage(rawData);
  }

  const jsonLabels = getJsonLabels(json);
  const structuredLabels = getStructuredLabels(structured);
  const labelStep = extractStepLabel(jsonLabels, structuredLabels);
  if (labelStep) {
    considerStep(normalizeStepLabel(labelStep));
  }

  if (!stepName && rawMessage) {
    const inferred = inferStepNameFromMessage(rawMessage);
    if (inferred) {
      considerStep(inferred);
    }
  }

  const message = rawMessage ? cleanMessage(rawMessage) : undefined;

  return { message, stepName, severity, timestamp, logId };
}

function extractStepLabel(
  jsonLabels?: Record<string, unknown>,
  structuredLabels?: Record<string, unknown>
): string | undefined {
  const candidates: Array<unknown> = [];
  if (jsonLabels) {
    candidates.push(
      jsonLabels["build_step"],
      jsonLabels["step"],
      jsonLabels["buildStep"]
    );
  }
  if (structuredLabels) {
    candidates.push(
      structuredLabels["build_step"],
      structuredLabels["step"],
      structuredLabels["buildStep"]
    );
  }

  for (const candidate of candidates) {
    const value = asNonEmptyString(candidate);
    if (value) {
      return value;
    }
  }

  return undefined;
}

function normalizeStepLabel(label: string): string {
  const patterns = [
    /Step\s+#\d+\s*-\s*"([^"]+)"/i,
    /Step\s+#\d+\s*:?\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = label.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return label.trim();
}

function inferStepNameFromMessage(message: string): string | undefined {
  const patterns = [
    /Step\s+#\d+\s*-\s*"([^"]+)"/i,
    /Step\s+#\d+\s*:?\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return undefined;
}

function safeEntryJson(entry: Entry): Record<string, unknown> | undefined {
  if (typeof entry.toJSON !== "function") return undefined;
  try {
    const value = entry.toJSON();
    return asRecord(value);
  } catch {
    return undefined;
  }
}

function safeEntryStructured(
  entry: Entry
): Record<string, unknown> | undefined {
  if (typeof entry.toStructuredJSON !== "function") return undefined;
  try {
    const value = entry.toStructuredJSON();
    return asRecord(value);
  } catch {
    return undefined;
  }
}

function getStructuredLabels(
  structured: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  return asRecord(structured?.["logging.googleapis.com/labels"]);
}

function extractLogId(views: EntryViews): string | undefined {
  const jsonInsertId = getStringFromRecord(views.json, "insertId");
  if (jsonInsertId) return jsonInsertId;

  const structuredInsertId = getStringFromRecord(
    views.structured,
    "logging.googleapis.com/insertId"
  );
  if (structuredInsertId) return structuredInsertId;

  return undefined;
}

function cleanMessage(message: string): string {
  const trimmed = message.trim();

  const stepMatch = trimmed.match(/^Step\s+#\d+\s*(?:-\s*)?"[^"]*":\s*(.*)$/);
  if (stepMatch?.[1]) {
    const remainder = stepMatch[1]?.trim() ?? "";
    if (remainder) {
      return remainder;
    }
    return trimmed;
  }

  const colonIndex = trimmed.indexOf(":");
  if (colonIndex > 0) {
    const prefix = trimmed.slice(0, colonIndex).trim();
    if (prefix && !prefix.includes(" ") && /^[A-Za-z0-9_-]{8,}$/.test(prefix)) {
      const remainder = trimmed.slice(colonIndex + 1).trim();
      if (remainder) {
        return remainder;
      }
    }
  }
  return trimmed;
}

function getJsonLabels(
  json: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  return asRecord(json?.["labels"]);
}

function parseTimestamp(
  timestamp?:
    | string
    | Date
    | {
        seconds?: number | string | Long | null;
        nanos?: number | string | Long | null;
      }
): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === "string") {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  const iso = serializeTimestamp(timestamp);
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

type EntryViews = {
  json?: Record<string, unknown>;
  structured?: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function getStringFromRecord(
  record: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  if (!record) return undefined;
  return asNonEmptyString(record[key]);
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function serializeTimestamp(
  timestamp?:
    | string
    | Date
    | {
        seconds?: number | string | Long | null;
        nanos?: number | string | Long | null;
      }
): string {
  if (!timestamp) return "";
  if (timestamp instanceof Date) return timestamp.toISOString();
  if (typeof timestamp === "string") return timestamp;

  const seconds = longToNumber(timestamp.seconds);
  const nanos = longToNumber(timestamp.nanos);

  const millis = seconds * 1_000 + Math.floor(nanos / 1_000_000);
  return new Date(millis).toISOString();
}

function longToNumber(
  value: number | string | Long | null | undefined
): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof value === "object" && value !== null) {
    const low = "low" in value ? (value.low as number) >>> 0 : 0;
    const high = "high" in value ? (value.high as number) >>> 0 : 0;
    return high * 0x1_0000_0000 + low;
  }
  return Number(value) || 0;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function isGrpcNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: number }).code === 5;
}

function resolveCallbackBaseUrl(): string {
  const apiBase = process.env.A0_API_BASEURL || "https://api.a0.run";
  if (process.env.NODE_ENV === "production") {
    return apiBase;
  }
  return "https://localapi.a0.run";
}
```

#### caller

```ts
try {
  for await (const event of deployer.streamLogs({ buildId: cbBuildID })) {
    if (event.type === "log") {
      if (event.stepName?.startsWith("PUBLIC_")) {
        logger.info(`INGEST: ${event.message}`);
      }
      // const parts = [
      //   event.timestamp ? event.timestamp.toISOString() : undefined,
      //   event.stepName,
      //   event.message,
      // ].filter(Boolean);
      // logger.info(
      //   `[Deployment: ${deploymentId} Build: ${cbBuildID}] ${parts.join(
      //     " | "
      //   )}`
      // );
    } else if (event.type === "status") {
      finalStatus = event.status;
      logger.info(
        `[Deployment: ${deploymentId} Build: ${cbBuildID}] Cloud Build Status -> ${event.status}`
      );
    } else if (event.type === "timeout") {
      timedOut = true;
      logger.warn(
        `[Deployment: ${deploymentId} Build: ${cbBuildID}] Log streaming timed out before reaching a terminal status.`
      );
    }
  }
} catch (error) {
  logger.error(
    { err: error instanceof Error ? error : { message: String(error) } },
    `[Deployment: ${deploymentId} Build: ${cbBuildID}] Failed while streaming Cloud Build logs.`
  );
}
```
