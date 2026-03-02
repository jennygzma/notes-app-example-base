import sqlite3
import json
import uuid
from pathlib import Path
from typing import Optional, Dict
from datetime import datetime


def run_migrations(db_path: Optional[Path] = None) -> int:
    if db_path is None:
        db_path = Path(__file__).parent / "generated" / "app.db"
    db_path.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    with conn:
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


def migrate_planner_to_tasks() -> Dict:
    planner_path = Path(__file__).parent / "generated" / "planner_items.json"
    db_path = Path(__file__).parent / "generated" / "app.db"
    
    if not planner_path.exists():
        return {"migrated": 0, "skipped": 0}
    
    with open(planner_path, "r") as f:
        planner_items = json.load(f)
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    migrated = 0
    skipped = 0
    
    with conn:
        for item in planner_items:
            if item.get("google_task_id"):
                skipped += 1
                continue
            
            date_str = item.get("date")
            if not date_str or not _is_valid_date(date_str):
                skipped += 1
                continue
            
            task_id = str(uuid.uuid4())
            title = item.get("title", "")
            completed = item.get("status") == "completed"
            due_date = date_str
            updated_at = item.get("updated_at", datetime.utcnow().isoformat() + "Z")
            
            cursor = conn.execute(
                """
                INSERT OR IGNORE INTO tasks (id, title, completed, due_date, google_task_id, updated_at, last_synced_at)
                VALUES (?, ?, ?, ?, NULL, ?, NULL)
                """,
                (task_id, title, 1 if completed else 0, due_date, updated_at)
            )
            
            if cursor.rowcount > 0:
                migrated += 1
            else:
                skipped += 1
        
        current_version = conn.execute("SELECT version FROM schema_version LIMIT 1").fetchone()
        if current_version:
            new_version = int(current_version["version"]) + 1
            conn.execute("UPDATE schema_version SET version = ?", (new_version,))
    
    return {"migrated": migrated, "skipped": skipped}


def _is_valid_date(date_str: str) -> bool:
    try:
        parts = date_str.split("-")
        if len(parts) != 3:
            return False
        year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
        if year < 1900 or year > 2100:
            return False
        if month < 1 or month > 12:
            return False
        if day < 1 or day > 31:
            return False
        return True
    except (ValueError, IndexError):
        return False
