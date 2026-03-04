import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional, Dict
from migrations import run_migrations


class OAuthTokenRepository:
    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            db_path = Path(__file__).parent.parent / "generated" / "app.db"
        db_path.parent.mkdir(exist_ok=True)
        self.db_path = db_path
        run_migrations(self.db_path)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get(self) -> Optional[Dict]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT access_token, refresh_token, expires_at, issued_at FROM oauth_tokens WHERE id = 1"
            ).fetchone()
        if not row:
            return None
        return {
            "access_token": row["access_token"],
            "refresh_token": row["refresh_token"],
            "expires_at": row["expires_at"],
            "issued_at": row["issued_at"],
        }

    def upsert(self, access_token: str, refresh_token: str, expires_at: str, issued_at: str) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO oauth_tokens (id, access_token, refresh_token, expires_at, issued_at)
                VALUES (1, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    access_token = excluded.access_token,
                    refresh_token = excluded.refresh_token,
                    expires_at = excluded.expires_at,
                    issued_at = excluded.issued_at
                """,
                (access_token, refresh_token, expires_at, issued_at),
            )

    def update_access_token(self, access_token: str, expires_at: str, issued_at: str) -> None:
        with self._connect() as conn:
            conn.execute(
                "UPDATE oauth_tokens SET access_token = ?, expires_at = ?, issued_at = ? WHERE id = 1",
                (access_token, expires_at, issued_at),
            )

    def is_expired(self, expires_at: str) -> bool:
        expires_dt = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        return expires_dt <= now

    def create_state(self, ttl_seconds: int = 600) -> str:
        state = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z").replace(":", "").replace("-", "") + "-" + str(datetime.now(timezone.utc).microsecond)
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=ttl_seconds)).isoformat().replace("+00:00", "Z")
        with self._connect() as conn:
            conn.execute(
                "INSERT INTO oauth_states (state, expires_at) VALUES (?, ?)",
                (state, expires_at),
            )
        return state

    def consume_state(self, state: str) -> bool:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT state, expires_at FROM oauth_states WHERE state = ?",
                (state,),
            ).fetchone()
            if not row:
                return False
            expires_dt = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
            if expires_dt <= datetime.now(timezone.utc):
                conn.execute("DELETE FROM oauth_states WHERE state = ?", (state,))
                return False
            conn.execute("DELETE FROM oauth_states WHERE state = ?", (state,))
        return True
