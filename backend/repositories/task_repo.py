import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from migrations import run_migrations


class TaskRepository:
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

    def _now(self) -> str:
        return datetime.utcnow().isoformat() + "Z"

    def create(self, title: str, completed: bool = False, due_date: Optional[str] = None) -> Dict:
        task_id = str(uuid.uuid4())
        updated_at = self._now()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO tasks (id, title, completed, due_date, google_task_id, updated_at, last_synced_at)
                VALUES (?, ?, ?, ?, NULL, ?, NULL)
                """,
                (task_id, title, 1 if completed else 0, due_date, updated_at),
            )
        return self.get_by_id(task_id)

    def get_all(self) -> List[Dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT id, title, completed, due_date, google_task_id, updated_at, last_synced_at FROM tasks"
            ).fetchall()
        return [self._row_to_dict(row) for row in rows]

    def get_by_id(self, task_id: str) -> Optional[Dict]:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT id, title, completed, due_date, google_task_id, updated_at, last_synced_at FROM tasks WHERE id = ?",
                (task_id,),
            ).fetchone()
        return self._row_to_dict(row) if row else None

    def update(
        self,
        task_id: str,
        title: Optional[str] = None,
        completed: Optional[bool] = None,
        due_date: Optional[str] = None,
        google_task_id: Optional[str] = None,
        last_synced_at: Optional[str] = None,
    ) -> Optional[Dict]:
        updates = {}
        if title is not None:
            updates["title"] = title
        if completed is not None:
            updates["completed"] = 1 if completed else 0
        if due_date is not None:
            updates["due_date"] = due_date
        if google_task_id is not None:
            updates["google_task_id"] = google_task_id
        if last_synced_at is not None:
            updates["last_synced_at"] = last_synced_at

        if not updates:
            return self.get_by_id(task_id)

        updates["updated_at"] = self._now()
        set_clause = ", ".join([f"{key} = ?" for key in updates.keys()])
        values = list(updates.values()) + [task_id]

        with self._connect() as conn:
            cursor = conn.execute(
                f"UPDATE tasks SET {set_clause} WHERE id = ?",
                values,
            )
            if cursor.rowcount == 0:
                return None

        return self.get_by_id(task_id)

    def delete(self, task_id: str) -> bool:
        with self._connect() as conn:
            cursor = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
            return cursor.rowcount > 0

    def _row_to_dict(self, row: sqlite3.Row) -> Dict:
        return {
            "id": row["id"],
            "title": row["title"],
            "completed": bool(row["completed"]),
            "due_date": row["due_date"],
            "google_task_id": row["google_task_id"],
            "updated_at": row["updated_at"],
            "last_synced_at": row["last_synced_at"],
        }
