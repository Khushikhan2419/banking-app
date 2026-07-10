"""Users microservice - registration/login + first-time-registration
SNS notification. This is the entry point new customers hit first.

User accounts now live in Aurora MySQL (RDS) instead of DynamoDB, so this
service can query/join relationally as the schema grows (KYC, roles, etc).
"""
import hashlib
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, FastAPI, HTTPException
from pydantic import BaseModel, EmailStr

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.aws_clients import mysql_connection, sns_publish

app = FastAPI(title="VeeraBank Users Service", version="1.0.0")
router = APIRouter(prefix="/users")

SNS_TOPIC_ENV = "USER_REGISTERED_TOPIC_ARN"

_SCHEMA_READY = False


def _ensure_schema():
    global _SCHEMA_READY
    if _SCHEMA_READY:
        return
    conn = mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id       CHAR(36)     NOT NULL PRIMARY KEY,
                    email          VARCHAR(255) NOT NULL UNIQUE,
                    full_name      VARCHAR(255) NOT NULL,
                    phone          VARCHAR(32)  NOT NULL,
                    password_hash VARCHAR(64)  NOT NULL,
                    created_at    DATETIME     NOT NULL
                )
                """
            )
        _SCHEMA_READY = True
    finally:
        conn.close()


def _hash_password(password: str) -> str:
    salt = os.getenv("PASSWORD_SALT", "veerabank-dev-salt")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@router.get("/")
def root():
    return {"service": "users-service", "status": "running"}


@router.post("/register")
def register(req: RegisterRequest):
    _ensure_schema()
    conn = mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM users WHERE email = %s", (req.email,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="User already registered")

            user_id = str(uuid.uuid4())
            created_at = datetime.now(timezone.utc)
            cur.execute(
                """
                INSERT INTO users (user_id, email, full_name, phone, password_hash, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, req.email, req.full_name, req.phone, _hash_password(req.password), created_at),
            )
    finally:
        conn.close()

    sns_publish(
        SNS_TOPIC_ENV,
        subject="Welcome to VeeraBank!",
        message=(
            f"New user registered: {req.full_name} ({req.email}, {req.phone}). "
            f"user_id={user_id}"
        ),
    )

    return {"user_id": user_id, "email": req.email, "full_name": req.full_name}


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(req: LoginRequest):
    _ensure_schema()
    conn = mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, email, full_name, password_hash FROM users WHERE email = %s",
                (req.email,),
            )
            user = cur.fetchone()
    finally:
        conn.close()

    if not user or user["password_hash"] != _hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {"user_id": user["user_id"], "email": user["email"], "full_name": user["full_name"]}


@router.get("/{user_id}")
def get_user(user_id: str):
    _ensure_schema()
    conn = mysql_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id, email, full_name FROM users WHERE user_id = %s",
                (user_id,),
            )
            user = cur.fetchone()
    finally:
        conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


app.include_router(router)
