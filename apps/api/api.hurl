POST https://localapi.riverly.tech/internal/v1/deployments/log
Content-Type: application/json

{
  "level": "info",
  "deploymentId": "__test_deployment_id__",
  "timestamp": 123456789,
  "msg": "__test_log_message_"
}
