"""
transactions-history Lambda
----------------------------
Sits behind API Gateway (HTTP API) and is the *only* thing that touches the
transaction-history S3 bucket. The transactions-service microservice calls
this over HTTPS instead of writing/reading DynamoDB directly.

Routes (API Gateway payload format 2.0):
  POST /history            body: {account_id, transaction_id, type, amount,
                                   balance_after, created_at}
       -> writes s3://<bucket>/<account_id>/<transaction_id>.json

  GET  /history/{account_id}
       -> lists + reads every object under <account_id>/ and returns them
          newest-first as a JSON array
"""
import json
import os
import boto3

s3 = boto3.client("s3")
BUCKET = os.environ["TRANSACTION_HISTORY_BUCKET"]


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, default=str),
    }


def _write_transaction(body: dict):
    required = {"account_id", "transaction_id"}
    if not required.issubset(body):
        return _response(400, {"error": f"body must include {sorted(required)}"})

    key = f"{body['account_id']}/{body['transaction_id']}.json"
    s3.put_object(
        Bucket=BUCKET,
        Key=key,
        Body=json.dumps(body, default=str).encode("utf-8"),
        ContentType="application/json",
    )
    return _response(201, body)


def _list_transactions(account_id: str):
    prefix = f"{account_id}/"
    items = []
    paginator = s3.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=BUCKET, Prefix=prefix):
        for obj in page.get("Contents", []):
            resp = s3.get_object(Bucket=BUCKET, Key=obj["Key"])
            items.append(json.loads(resp["Body"].read()))

    items.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return _response(200, items)


def handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
    path = event.get("rawPath", "/")

    try:
        if method == "POST" and path.rstrip("/") == "/history":
            body = json.loads(event.get("body") or "{}")
            return _write_transaction(body)

        if method == "GET" and path.startswith("/history/"):
            account_id = event["pathParameters"]["account_id"]
            return _list_transactions(account_id)

        return _response(404, {"error": "no matching route"})
    except Exception as exc:  # noqa: BLE001 - surfaced to the caller as 500
        return _response(500, {"error": str(exc)})
