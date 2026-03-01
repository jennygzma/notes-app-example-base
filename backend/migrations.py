import sqlite3
import json
import shutil
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Optional


def migrate_planner_to_tasks() -> Dict:
    planner_path = Path(__file__).parent / "generated" / "planner_items.json"
    
    if not planner_path.exists():
        return {"migrated": 0, "skipped": 0, "error": "planner_items.json not found"}
    
    backup_path = Path(__file__).parent / "generated" / "planner_items.backup.json"
    shutil.copy(planner_path, backup_path)
    
    with open(planner_path, 'r') as f:
        planner_items = json.load(f)
    
    db_path = Path(__file__).parent / "generated" / "app.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    migrated = 0
    skipped = 0
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
    for item in planner_items:
        try:
            if item.get('date'):
                import re
                if not re.match(r'^\d{4}-\d{2}-\d{2}$', item['date']):
                    skipped += 1
                    continue
            
            cursor.execute(
                """
                INSERT INTO tasks (id, title, completed, due_date, google_task_id, updated_at, last_synced_at)
                VALUES (?, ?, ?, ?, NULL, ?, NULL)
                """,
                (
                    item['id'],
                    item['title'],
                    1 if item.get('status') == 'completed' else 0,
                    item.get('date'),
                    item.get('updated_at', now)
                )
            )
            migrated += 1
        except Exception as e:
            skipped += 1
            print(f"Failed to migrate item {item.get('id')}: {str(e)}")
    
    conn.commit()
    conn.close()
    
    return {"migrated": migrated, "skipped": skipped}


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