export interface PubSubMessage {
  data?: string;
  attributes?: Record<string, string>;
}

export interface CloudFunctionsContext {
  eventId: string;
  timestamp: string;
  eventType?: string;
  resource?: string;
}

export const handleCloudBuildEvent = async (
  pubsubEvent: PubSubMessage,
  context: CloudFunctionsContext
) => {
  const targetUrl =
    process.env.TARGET_DEPLOYMENT_WEBHOOK ??
    "https://localapi.riverly.tech/__/v1/deployments/gcp/events";

  const targetUsername =
    process.env.TARGET_DEPLOYMENT_WEBHOOK_USERNAME ?? "a0runner";
  const targetPassword =
    process.env.TARGET_DEPLOYMENT_WEBHOOK_PASSWORD ?? "VeryS3Cure";

  if (!pubsubEvent?.data) {
    console.error("Missing Pub/Sub message data");
    return;
  }

  let buildPayload: unknown;
  try {
    const decoded = Buffer.from(pubsubEvent.data, "base64").toString("utf8");
    buildPayload = JSON.parse(decoded);
  } catch (error) {
    console.error("Unable to decode Cloud Build payload", error);
    throw error;
  }

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(targetUsername && targetPassword
        ? {
            Authorization: `Basic ${Buffer.from(
              `${targetUsername}:${targetPassword}`
            ).toString("base64")}`,
          }
        : {}),
    },
    body: JSON.stringify({
      context,
      attributes: pubsubEvent.attributes ?? {},
      build: buildPayload,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Deployment webhook request failed", {
      status: response.status,
      statusText: response.statusText,
      body: text,
    });
    throw new Error(`Deployment webhook returned HTTP ${response.status}`);
  }
};
