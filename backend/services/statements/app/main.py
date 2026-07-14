"""Statements microservice - a real account statement, computed on the
fly from transfers-service's own ledger (no separate copy of the data
to keep in sync) plus this account's current balance."""
import os
import sys
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Optional

from fastapi import FastAPI, HTTPException, Query

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.aws_clients import table
from common.service_base import get_account_or_404

app = FastAPI(title="VeeraBank Statements Service", version="2.0.0")
transfers_table = table("transfers")


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/statements/{account_id}")
def statement(
    account_id: str,
    from_ts: Optional[str] = Query(None, description="ISO 8601 datetime, inclusive lower bound"),
    to_ts: Optional[str] = Query(None, description="ISO 8601 datetime, inclusive upper bound"),
):
    """Account is required (path param) - a statement can never be pulled
    without one. The window is a precise timestamp range (not just a
    day), so callers can ask for things like 'the last 30 minutes',
    not just whole calendar days. ISO 8601 UTC timestamps sort
    lexicographically, so plain string comparison is enough."""
    account = get_account_or_404(account_id)

    sent = transfers_table.query(IndexName="from_account_id-index", KeyConditionExpression="from_account_id = :a", ExpressionAttributeValues={":a": account_id}).get("Items", [])
    received = transfers_table.query(IndexName="to_account_id-index", KeyConditionExpression="to_account_id = :a", ExpressionAttributeValues={":a": account_id}).get("Items", [])

    lines = []
    for t in sent:
        lines.append({"date": t["created_at"], "description": f"Transfer out{(' - ' + t['note']) if t.get('note') else ''}", "amount": -Decimal(t["amount"]), "transfer_id": t["id"]})
    for t in received:
        lines.append({"date": t["created_at"], "description": f"Transfer in{(' - ' + t['note']) if t.get('note') else ''}", "amount": Decimal(t["amount"]), "transfer_id": t["id"]})

    if from_ts:
        lines = [l for l in lines if l["date"] >= from_ts]
    if to_ts:
        lines = [l for l in lines if l["date"] <= to_ts]

    lines.sort(key=lambda l: l["date"])
    total_in = sum((l["amount"] for l in lines if l["amount"] > 0), Decimal(0))
    total_out = sum((-l["amount"] for l in lines if l["amount"] < 0), Decimal(0))

    return {
        "account_id": account_id,
        "account_number": account["account_number"],
        "owner_name": account["owner_name"],
        "current_balance": account["balance"],
        "period": {"from": from_ts, "to": to_ts},
        "total_credits": total_in,
        "total_debits": total_out,
        "line_count": len(lines),
        "lines": lines,
    }
