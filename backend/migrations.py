import sqlite3
import json
import uuid
from pathlib import Path
from typing import Optional, Dict
from datetime import datetime


LATEST_SCHEMA_VERSION = 4


def _get_db_path(db_path: Optional[Path]) -> Path:
    if db_path is None:
        db_path = Path(__file__).parent / "generated" / "app.db"
    db_path.parent.mkdir(exist_ok=True)
    return db_path


def _ensure_schema_version(conn: sqlite3.Connection) -> int:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER NOT NULL
        )
        """
    )
    row = conn.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
    if not row:
        conn.execute("INSERT INTO schema_version (version) VALUES (1)")
        return 1
    return int(row["version"])


def _set_schema_version(conn: sqlite3.Connection, version: int) -> None:
    conn.execute("UPDATE schema_version SET version = ?", (version,))


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, ddl: str) -> None:
    columns = [r["name"] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in columns:
        conn.execute(ddl)


def run_migrations(db_path: Optional[Path] = None) -> int:
    db_path = _get_db_path(db_path)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    with conn:
        version = _ensure_schema_version(conn)

        if version < 2:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS tasks (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    completed INTEGER NOT NULL DEFAULT 0,
                    due_date TEXT NULL,
                    google_task_id TEXT NULL,
                    updated_at TEXT NOT NULL,
                    last_synced_at TEXT NULL
                )
                """
            )
            _set_schema_version(conn, 2)
            version = 2

        if version < 3:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS oauth_tokens (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    access_token TEXT NOT NULL,
                    refresh_token TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    issued_at TEXT
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS oauth_states (
                    state TEXT PRIMARY KEY,
                    expires_at TEXT NOT NULL
                )
                """
            )
            _ensure_column(
                conn,
                "oauth_tokens",
                "issued_at",
                "ALTER TABLE oauth_tokens ADD COLUMN issued_at TEXT",
            )
            _set_schema_version(conn, 3)
            version = 3

        if version < 4:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS notes (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL,
                    folder_id TEXT,
                    is_inspiration INTEGER NOT NULL DEFAULT 0,
                    is_analyzed INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    activity_history TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS note_versions (
                    id TEXT PRIMARY KEY,
                    note_id TEXT NOT NULL,
                    version_number INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    body TEXT NOT NULL,
                    folder_id TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (note_id) REFERENCES notes(id)
                )
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_note_versions_note_id 
                ON note_versions(note_id)
                """
            )
            _set_schema_version(conn, 4)
            version = 4

        return version


def migrate_planner_to_tasks(db_path: Optional[Path] = None) -> Dict:
    db_path = _get_db_path(db_path)
    
    planner_file = Path(__file__).parent / "generated" / "planner_items.json"
    
    if not planner_file.exists():
        return {"migrated": 0, "skipped": 0, "errors": []}
    
    try:
        with open(planner_file, 'r') as f:
            planner_items = json.load(f)
    except Exception as e:
        return {"migrated": 0, "skipped": 0, "errors": [f"Failed to read planner_items.json: {str(e)}"]}
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    migrated = 0
    skipped = 0
    errors = []
    
    with conn:
        for item in planner_items:
            try:
                if item.get("google_task_id"):
                    skipped += 1
                    continue
                
                date_str = item.get("date")
                if not date_str:
                    skipped += 1
                    continue
                
                try:
                    parts = date_str.split("-")
                    if len(parts) != 3:
                        skipped += 1
                        continue
                    year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                    if year < 1900 or year > 2100 or month < 1 or month > 12 or day < 1 or day > 31:
                        skipped += 1
                        continue
                    due_date = date_str
                except (ValueError, IndexError):
                    skipped += 1
                    continue
                
                title = item.get("title", "Untitled")
                completed = 1 if item.get("status") == "completed" else 0
                task_id = item.get("id") or str(uuid.uuid4())
                updated_at = item.get("updated_at") or datetime.utcnow().isoformat() + "Z"
                
                cursor = conn.execute(
                    "INSERT OR IGNORE INTO tasks (id, title, completed, due_date, google_task_id, updated_at, last_synced_at) VALUES (?, ?, ?, ?, NULL, ?, NULL)",
                    (task_id, title, completed, due_date, updated_at)
                )
                
                if cursor.rowcount > 0:
                    migrated += 1
                else:
                    skipped += 1
                    
            except Exception as e:
                errors.append(f"Failed to migrate item {item.get('id', 'unknown')}: {str(e)}")
    
    current_version = run_migrations(db_path)
    if migrated > 0:
        with sqlite3.connect(db_path) as conn:
            conn.execute("UPDATE schema_version SET version = ?", (current_version + 1,))
    
    return {"migrated": migrated, "skipped": skipped, "errors": errors}
