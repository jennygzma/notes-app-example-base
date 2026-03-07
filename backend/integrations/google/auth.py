import os
import requests
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from repositories.oauth_token_repo import OAuthTokenRepository


class GoogleAuthService:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        self.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        self.repo = OAuthTokenRepository()

    def get_authorization_url(self) -> str:
        state = self.repo.create_state()
        scopes = [
            "https://www.googleapis.com/auth/tasks",
            "https://www.googleapis.com/auth/gmail.send"
        ]
        scope = " ".join(scopes)
        return (
            "https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={self.client_id}"
            f"&redirect_uri={self.redirect_uri}"
            "&response_type=code"
            f"&scope={scope}"
            "&access_type=offline"
            "&prompt=consent"
            f"&state={state}"
        )

    def handle_callback(self, code: str, state: str) -> Dict:
        if not self.repo.consume_state(state):
            raise ValueError("Invalid or expired OAuth state")
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        response = requests.post(token_url, data=data, timeout=30)
        response.raise_for_status()
        payload = response.json()

        access_token = payload["access_token"]
        refresh_token = payload.get("refresh_token")
        expires_in = int(payload.get("expires_in", 3600))
        issued_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat().replace("+00:00", "Z")

        existing = self.repo.get()
        if existing and not refresh_token:
            refresh_token = existing["refresh_token"]

        if not refresh_token:
            raise ValueError("Missing refresh_token from OAuth response")

        self.repo.upsert(access_token=access_token, refresh_token=refresh_token, expires_at=expires_at, issued_at=issued_at)
        return {"access_token": access_token, "expires_at": expires_at}

    def get_valid_access_token(self) -> Optional[str]:
        token = self.repo.get()
        if not token:
            return None
        if self.repo.is_expired(token["expires_at"]):
            return self.refresh_access_token(token["refresh_token"])
        return token["access_token"]

    def refresh_access_token(self, refresh_token: str) -> str:
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        response = requests.post(token_url, data=data, timeout=30)
        response.raise_for_status()
        payload = response.json()

        access_token = payload["access_token"]
        expires_in = int(payload.get("expires_in", 3600))
        issued_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat().replace("+00:00", "Z")

        self.repo.update_access_token(access_token=access_token, expires_at=expires_at, issued_at=issued_at)
        return access_token
