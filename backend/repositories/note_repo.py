import sqlite3
import json
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class NoteRepository:
    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            db_path = Path(__file__).parent.parent / "generated" / "app.db"
        self.db_path = db_path
        self._ensure_connection()
    
    def _ensure_connection(self):
        self.db_path.parent.mkdir(exist_ok=True)
    
    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _now(self) -> str:
        return datetime.utcnow().isoformat() + "Z"
    
    def _generate_id(self) -> str:
        return str(uuid.uuid4())
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict:
        note = {
            "id": row["id"],
            "title": row["title"],
            "body": row["body"],
            "folder_id": row["folder_id"],
            "is_inspiration": bool(row["is_inspiration"]),
            "is_analyzed": bool(row["is_analyzed"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "activity_history": json.loads(row["activity_history"])
        }
        return note
    
    def _version_row_to_dict(self, row: sqlite3.Row) -> Dict:
        return {
            "id": row["id"],
            "note_id": row["note_id"],
            "version_number": row["version_number"],
            "title": row["title"],
            "body": row["body"],
            "folder_id": row["folder_id"],
            "created_at": row["created_at"]
        }
    
    def create(self, title: str, body: str) -> Dict:
        conn = self._get_connection()
        timestamp = self._now()
        note_id = self._generate_id()
        
        activity_history = [{
            "type": "created",
            "timestamp": timestamp,
            "details": {}
        }]
        
        with conn:
            conn.execute(
                """
                INSERT INTO notes 
                (id, title, body, folder_id, is_inspiration, is_analyzed, created_at, updated_at, activity_history)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (note_id, title, body, None, 0, 0, timestamp, timestamp, json.dumps(activity_history))
            )
            
            version_id = self._generate_id()
            conn.execute(
                """
                INSERT INTO note_versions
                (id, note_id, version_number, title, body, folder_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (version_id, note_id, 1, title, body, None, timestamp)
            )
        
        return self.get_by_id(note_id)
    
    def get_all(self) -> List[Dict]:
        conn = self._get_connection()
        rows = conn.execute("SELECT * FROM notes ORDER BY updated_at DESC").fetchall()
        return [self._row_to_dict(row) for row in rows]
    
    def get_by_id(self, note_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        if row:
            return self._row_to_dict(row)
        return None
    
    def update(
        self, 
        note_id: str, 
        title: Optional[str] = None, 
        body: Optional[str] = None, 
        is_inspiration: Optional[bool] = None, 
        is_analyzed: Optional[bool] = None,
        folder_id: Optional[str] = None
    ) -> Optional[Dict]:
        conn = self._get_connection()
        
        current_note = self.get_by_id(note_id)
        if not current_note:
            return None
        
        timestamp = self._now()
        previous_folder_id = current_note.get("folder_id")
        
        activity_history = current_note.get("activity_history", [])
        
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = ?")
            params.append(title)
        else:
            title = current_note["title"]
        
        if body is not None:
            updates.append("body = ?")
            params.append(body)
        else:
            body = current_note["body"]
        
        if is_inspiration is not None:
            updates.append("is_inspiration = ?")
            params.append(1 if is_inspiration else 0)
        
        if is_analyzed is not None:
            updates.append("is_analyzed = ?")
            params.append(1 if is_analyzed else 0)
        
        if folder_id is not None:
            updates.append("folder_id = ?")
            params.append(folder_id)
            
            if folder_id != previous_folder_id:
                activity_history.append({
                    "type": "moved",
                    "timestamp": timestamp,
                    "details": {
                        "from_folder": previous_folder_id,
                        "to_folder": folder_id
                    }
                })
            else:
                activity_history.append({
                    "type": "updated",
                    "timestamp": timestamp,
                    "details": {}
                })
        else:
            folder_id = current_note["folder_id"]
            activity_history.append({
                "type": "updated",
                "timestamp": timestamp,
                "details": {}
            })
        
        updates.append("updated_at = ?")
        params.append(timestamp)
        
        updates.append("activity_history = ?")
        params.append(json.dumps(activity_history))
        
        params.append(note_id)
        
        with conn:
            if title != current_note["title"] or body != current_note["body"]:
                self.save_version(note_id, title, body, folder_id)
            
            conn.execute(
                f"UPDATE notes SET {', '.join(updates)} WHERE id = ?",
                params
            )
        
        return self.get_by_id(note_id)
    
    def delete(self, note_id: str) -> bool:
        conn = self._get_connection()
        with conn:
            conn.execute("DELETE FROM note_versions WHERE note_id = ?", (note_id,))
            cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            return cursor.rowcount > 0
    
    def save_version(self, note_id: str, title: str, body: str, folder_id: Optional[str]) -> Dict:
        conn = self._get_connection()
        
        max_version = conn.execute(
            "SELECT MAX(version_number) as max_ver FROM note_versions WHERE note_id = ?",
            (note_id,)
        ).fetchone()
        
        next_version = (max_version["max_ver"] or 0) + 1
        version_id = self._generate_id()
        timestamp = self._now()
        
        with conn:
            conn.execute(
                """
                INSERT INTO note_versions
                (id, note_id, version_number, title, body, folder_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (version_id, note_id, next_version, title, body, folder_id, timestamp)
            )
        
        return self.get_version(version_id)
    
    def get_versions(self, note_id: str) -> List[Dict]:
        conn = self._get_connection()
        rows = conn.execute(
            "SELECT * FROM note_versions WHERE note_id = ? ORDER BY version_number DESC",
            (note_id,)
        ).fetchall()
        return [self._version_row_to_dict(row) for row in rows]
    
    def get_version(self, version_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        row = conn.execute(
            "SELECT * FROM note_versions WHERE id = ?",
            (version_id,)
        ).fetchone()
        if row:
            return self._version_row_to_dict(row)
        return None
    
    def search_notes_and_versions(self, query: str) -> List[Tuple[Dict, bool, Optional[Dict]]]:
        if not query or not query.strip():
            return []
        
        conn = self._get_connection()
        search_term = f"%{query.lower()}%"
        results = []
        
        note_rows = conn.execute(
            """
            SELECT * FROM notes 
            WHERE LOWER(title) LIKE ? OR LOWER(body) LIKE ?
            ORDER BY updated_at DESC
            """,
            (search_term, search_term)
        ).fetchall()
        
        for row in note_rows:
            note = self._row_to_dict(row)
            results.append((note, False, None))
        
        version_rows = conn.execute(
            """
            SELECT nv.*, n.updated_at as note_updated_at
            FROM note_versions nv
            JOIN notes n ON nv.note_id = n.id
            WHERE (LOWER(nv.title) LIKE ? OR LOWER(nv.body) LIKE ?)
            AND nv.version_number < (
                SELECT MAX(version_number) FROM note_versions WHERE note_id = nv.note_id
            )
            ORDER BY n.updated_at DESC
            """,
            (search_term, search_term)
        ).fetchall()
        
        for row in version_rows:
            version = self._version_row_to_dict(row)
            note = self.get_by_id(version["note_id"])
            if note:
                results.append((note, True, version))
        
        return results