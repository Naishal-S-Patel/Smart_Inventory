from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings


def _build_token(expires_in_seconds: int = 300) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "userId": "user-123",
        "email": "user@example.com",
        "roles": ["ROLE_USER"],
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(seconds=expires_in_seconds)).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def test_protected_requires_token(client):
    response = client.get("/predict/demand")
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_protected_accepts_valid_token(client):
    token = _build_token()
    response = client.get(
        "/predict/demand", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "Prediction generated"
    assert isinstance(body["data"]["forecast"], list)


def test_invalid_token_rejected(client):
    response = client.get(
        "/predict/demand", headers={"Authorization": "Bearer invalid.token"}
    )
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "UNAUTHORIZED"


def test_expired_token_rejected(client):
    token = _build_token(expires_in_seconds=-10)
    response = client.get(
        "/predict/demand", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "UNAUTHORIZED"
