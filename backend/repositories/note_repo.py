import sqlite3
import uuid
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime, timezone

class NoteRepository:
    def __init__(self, db_path: str = "generated/app.db"):
        self.db_path = Path(db_path)
        
    def _get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def _generate_id(self) -> str:
        return str(uuid.uuid4())
    
    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    
    def _row_to_dict(self, row: sqlite3.Row) -> Dict:
        return dict(row)
    
    def create(self, title: str, body: str) -> Dict:
        note_id = self._generate_id()
        timestamp = self._now()
        
        conn = self._get_connection()
        with conn:
            conn.execute(
                """
                INSERT INTO notes (id, title, body, is_inspiration, is_analyzed, folder_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (note_id, title, body, 0, 0, None, timestamp, timestamp)
            )
            
            version_id = self._generate_id()
            conn.execute(
                """
                INSERT INTO note_versions (id, note_id, version_number, title, body, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (version_id, note_id, 1, title, body, timestamp)
            )
        
        return self.get_by_id(note_id)
    
    def get_all(self) -> List[Dict]:
        conn = self._get_connection()
        cursor = conn.execute("SELECT * FROM notes ORDER BY updated_at DESC")
        notes = [self._row_to_dict(row) for row in cursor.fetchall()]
        conn.close()
        return notes
    
    def get_by_id(self, note_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        cursor = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_dict(row) if row else None
    
    def update(
        self, 
        note_id: str, 
        title: Optional[str] = None, 
        body: Optional[str] = None, 
        is_inspiration: Optional[bool] = None, 
        is_analyzed: Optional[bool] = None,
        folder_id: Optional[str] = None
    ) -> Optional[Dict]:
        note = self.get_by_id(note_id)
        if not note:
            return None
        
        timestamp = self._now()
        
        updates = []
        params = []
        
        if title is not None or body is not None:
            self.save_version(note)
        
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
        
        conn = self._get_connection()
        with conn:
            conn.execute(
                f"UPDATE notes SET {', '.join(updates)} WHERE id = ?",
                params
            )
        conn.close()
        
        return self.get_by_id(note_id)
    
    def delete(self, note_id: str) -> bool:
        conn = self._get_connection()
        with conn:
            cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
            deleted = cursor.rowcount > 0
        conn.close()
        return deleted
    
    def save_version(self, note: Dict) -> Dict:
        note_id = note["id"]
        
        conn = self._get_connection()
        with conn:
            cursor = conn.execute(
                "SELECT MAX(version_number) as max_version FROM note_versions WHERE note_id = ?",
                (note_id,)
            )
            row = cursor.fetchone()
            next_version = (row["max_version"] or 0) + 1
            
            version_id = self._generate_id()
            timestamp = self._now()
            
            conn.execute(
                """
                INSERT INTO note_versions (id, note_id, version_number, title, body, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (version_id, note_id, next_version, note["title"], note["body"], timestamp)
            )
        
        conn.close()
        return self.get_version(version_id)
    
    def get_versions(self, note_id: str) -> List[Dict]:
        conn = self._get_connection()
        cursor = conn.execute(
            "SELECT * FROM note_versions WHERE note_id = ? ORDER BY version_number DESC",
            (note_id,)
        )
        versions = [self._row_to_dict(row) for row in cursor.fetchall()]
        conn.close()
        return versions
    
    def get_version(self, version_id: str) -> Optional[Dict]:
        conn = self._get_connection()
        cursor = conn.execute("SELECT * FROM note_versions WHERE id = ?", (version_id,))
        row = cursor.fetchone()
        conn.close()
        return self._row_to_dict(row) if row else None
    
    def search_notes_and_versions(self, query: str) -> List[Dict]:
        search_term = f"%{query}%"
        
        conn = self._get_connection()
        
        cursor = conn.execute(
            """
            SELECT id, title, body, created_at
            FROM notes
            WHERE title LIKE ? OR body LIKE ?
            """,
            (search_term, search_term)
        )
        note_results = []
        for row in cursor.fetchall():
            note_results.append({
                "id": row["id"],
                "note_id": row["id"],
                "title": row["title"],
                "body": row["body"],
                "is_version_history": False,
                "version_number": None,
                "created_at": row["created_at"],
            })
        
        cursor = conn.execute(
            """
            SELECT id, note_id, version_number, title, body, created_at
            FROM note_versions
            WHERE title LIKE ? OR body LIKE ?
            """,
            (search_term, search_term)
        )
        version_results = []
        for row in cursor.fetchall():
            version_results.append({
                "id": row["id"],
                "note_id": row["note_id"],
                "title": row["title"],
                "body": row["body"],
                "is_version_history": True,
                "version_number": row["version_number"],
                "created_at": row["created_at"],
            })
        
        conn.close()
        
        return note_results + version_results
