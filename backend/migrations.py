import sqlite3
import json
import shutil
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


def migrate_planner_to_tasks(base_path: Optional[Path] = None) -> Dict:
    if base_path is None:
        base_path = Path(__file__).parent / "generated"
    
    planner_file = base_path / "planner_items.json"
    backup_file = base_path / "planner_items.backup.json"
    db_path = base_path / "app.db"
    
    if not planner_file.exists():
        return {"migrated": 0, "skipped": 0, "error": "planner_items.json not found"}
    
    try:
        with open(planner_file, "r") as f:
            planner_items = json.load(f)
    except Exception as e:
        return {"migrated": 0, "skipped": 0, "error": f"Failed to read planner_items.json: {str(e)}"}
    
    migrated = 0
    skipped = 0
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    try:
        for item in planner_items:
            if item.get("google_task_id"):
                skipped += 1
                continue
            
            date = item.get("date")
            if not date or len(date) != 10:
                skipped += 1
                continue
            
            task_id = str(uuid.uuid4())
            title = item.get("title", "Untitled")
            completed = 1 if item.get("status") == "completed" else 0
            due_date = date
            updated_at = item.get("updated_at") or datetime.utcnow().isoformat() + "Z"
            
            conn.execute(
                """
                INSERT OR IGNORE INTO tasks (id, title, completed, due_date, google_task_id, updated_at, last_synced_at)
                VALUES (?, ?, ?, ?, NULL, ?, NULL)
                """,
                (task_id, title, completed, due_date, updated_at)
            )
            migrated += 1
        
        conn.commit()
        
        shutil.copy(planner_file, backup_file)
        
    except Exception as e:
        conn.rollback()
        return {"migrated": 0, "skipped": 0, "error": f"Migration failed: {str(e)}"}
    finally:
        conn.close()
    
    return {"migrated": migrated, "skipped": skipped}
