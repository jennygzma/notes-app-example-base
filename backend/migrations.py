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


def migrate_planner_to_tasks(db_path: Optional[Path] = None) -> Dict:
    if db_path is None:
        db_path = Path(__file__).parent / "generated" / "app.db"
    
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
