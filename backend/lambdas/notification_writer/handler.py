"""
notification-writer Lambda
---------------------------
The "notifications-service" subscriber to the user-registered SNS topic.

SNS -> SQS (user-registered-notifications queue) -> this Lambda -> writes a
row into the same DynamoDB table the notifications-service microservice
already reads from (GET /notifications/items), so a new welcome
notification just shows up in the app with no extra plumbing.
"""
import json
import os
import uuid
from datetime import datetime, timezone

import boto3

dynamodb = boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", "us-east-1"))
TABLE_NAME = os.environ["NOTIFICATIONS_TABLE"]
table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    for record in event.get("Records", []):
        # SQS record body is the raw SNS message envelope (JSON string).
        sqs_body = json.loads(record["body"])
        message = sqs_body.get("Message", sqs_body.get("body", ""))
        subject = sqs_body.get("Subject", "Notification")

        item = {
            "id": str(uuid.uuid4()),
            "type": "user_registered",
            "subject": subject,
            "message": message,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        table.put_item(Item=item)

    return {"statusCode": 200}
