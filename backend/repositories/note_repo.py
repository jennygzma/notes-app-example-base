import sqlite3
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class NoteRepository:
    def __init__(self, db_path: Optional[Path] = None):
        if db_path is None:
            db_path = Path(__file__).parent.parent / "generated" / "app.db"
        self.db_path = db_path
    
    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _now(self) -> str:
        return datetime.utcnow().isoformat() + "Z"
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict:
        return {
            "id": row["id"],
            "title": row["title"],
            "body": row["body"],
            "is_inspiration": bool(row["is_inspiration"]),
            "is_analyzed": bool(row["is_analyzed"]),
            "folder_id": row["folder_id"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "activity_history": []
        }
    
    def create(self, title: str, body: str) -> Dict:
        note_id = str(uuid.uuid4())
        timestamp = self._now()
        
        conn = self._get_connection()
        with conn:
            conn.execute(
                """
                INSERT INTO notes (id, title, body, is_inspiration, is_analyzed, folder_id, created_at, updated_at)
                VALUES (?, ?, ?, 0, 0, NULL, ?, ?)
                """,
                (note_id, title, body, timestamp, timestamp)
            )
            
            version_id = str(uuid.uuid4())
            conn.execute(
                """
                INSERT INTO note_versions (id, note_id, version_number, title, body, created_at)
                VALUES (?, ?, 1, ?, ?, ?)
                """,
                (version_id, note_id, 1, title, body, timestamp)
            )
        
        return {
            "id": note_id,
            "title": title,
            "body": body,
            "is_inspiration": False,
            "is_analyzed": False,
            "folder_id": None,
            "created_at": timestamp,
            "updated_at": timestamp,
            "activity_history": []
        }
    
    def get_all(self) -> List[Dict]:
        conn = self._get_connection()
        with conn:
            rows = conn.execute("SELECT * FROM notes ORDER BY updated_at DESC").fetchall()
            return [self._row_to_dict(row) for row in rows]
    
    def get_by_id(self, note_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        with conn:
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
        with conn:
            row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
            if not row:
                return None
            
            if title is not None or body is not None:
                self.save_version(note_id)
            
            timestamp = self._now()
            updates = []
            params = []
            
            if title is not None:
                updates.append("title = ?")
                params.append(title)
            if body is not None:
                updates.append("body = ?")
                params.append(body)
            if is_inspiration is not None:
                updates.append("is_inspiration = ?")
                params.append(1 if is_inspiration else 0)
            if is_analyzed is not None:
                updates.append("is_analyzed = ?")
                params.append(1 if is_analyzed else 0)
            if folder_id is not None:
                updates.append("folder_id = ?")
                params.append(folder_id)
            
            updates.append("updated_at = ?")
            params.append(timestamp)
            params.append(note_id)
            
            conn.execute(
                f"UPDATE notes SET {', '.join(updates)} WHERE id = ?",
                params
            )
            
            updated_row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
            return self._row_to_dict(updated_row)
    
    def delete(self, note_id: str) -> bool:
        conn = self._get_connection()
        with conn:
            cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            return cursor.rowcount > 0
    
    def save_version(self, note_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        with conn:
            note_row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
            if not note_row:
                return None
            
            max_version = conn.execute(
                "SELECT MAX(version_number) as max_ver FROM note_versions WHERE note_id = ?",
                (note_id,)
            ).fetchone()
            
            next_version = (max_version["max_ver"] or 0) + 1
            version_id = str(uuid.uuid4())
            timestamp = self._now()
            
            conn.execute(
                """
                INSERT INTO note_versions (id, note_id, version_number, title, body, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (version_id, note_id, next_version, note_row["title"], note_row["body"], timestamp)
            )
            
            return {
                "id": version_id,
                "note_id": note_id,
                "version_number": next_version,
                "title": note_row["title"],
                "body": note_row["body"],
                "created_at": timestamp
            }
    
    def get_versions(self, note_id: str) -> List[Dict]:
        conn = self._get_connection()
        with conn:
            rows = conn.execute(
                """
                SELECT * FROM note_versions 
                WHERE note_id = ? 
                ORDER BY version_number DESC
                """,
                (note_id,)
            ).fetchall()
            
            return [{
                "id": row["id"],
                "note_id": row["note_id"],
                "version_number": row["version_number"],
                "title": row["title"],
                "body": row["body"],
                "created_at": row["created_at"]
            } for row in rows]
    
    def get_version(self, version_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        with conn:
            row = conn.execute(
                "SELECT * FROM note_versions WHERE id = ?",
                (version_id,)
            ).fetchone()
            
            if row:
                return {
                    "id": row["id"],
                    "note_id": row["note_id"],
                    "version_number": row["version_number"],
                    "title": row["title"],
                    "body": row["body"],
                    "created_at": row["created_at"]
                }
            return None
    
    def search_notes_and_versions(self, query: str) -> List[Dict]:
        conn = self._get_connection()
        search_pattern = f"%{query}%"
        results = []
        
        with conn:
            note_rows = conn.execute(
                """
                SELECT id, id as note_id, title, body, created_at, 0 as is_version, NULL as version_number
                FROM notes
                WHERE title LIKE ? OR body LIKE ?
                """,
                (search_pattern, search_pattern)
            ).fetchall()
            
            for row in note_rows:
                results.append({
                    "id": row["id"],
                    "note_id": row["note_id"],
                    "title": row["title"],
                    "body": row["body"],
                    "is_version_history": False,
                    "version_number": None,
                    "created_at": row["created_at"]
                })
            
            version_rows = conn.execute(
                """
                SELECT id, note_id, title, body, created_at, 1 as is_version, version_number
                FROM note_versions
                WHERE title LIKE ? OR body LIKE ?
                """,
                (search_pattern, search_pattern)
            ).fetchall()
            
            for row in version_rows:
                results.append({
                    "id": row["id"],
                    "note_id": row["note_id"],
                    "title": row["title"],
                    "body": row["body"],
                    "is_version_history": True,
                    "version_number": row["version_number"],
                    "created_at": row["created_at"]
                })
        
        return results