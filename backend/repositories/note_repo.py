from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class NoteRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "notes.json")

    def create(self, title: str, body: str, folder_id: Optional[str] = None) -> Dict:
        notes = self._read_json()
        note = {
            "id": self._generate_id(),
            "title": title,
            "body": body,
            "folder_id": folder_id,
            "is_inspiration": False,
            "is_analyzed": False,
            "created_at": self._now(),
            "updated_at": self._now()
        }
        notes.append(note)
        self._write_json(notes)
        return note
    
    def get_all(self) -> List[Dict]:
        return self._read_json()
    
    def get_by_id(self, note_id: str) -> Optional[Dict]:
        notes = self._read_json()
        return next((n for n in notes if n["id"] == note_id), None)
    
    def update(
        self, 
        note_id: str, 
        title: Optional[str] = None, 
        body: Optional[str] = None,
        folder_id: Optional[str] = None,
        is_inspiration: Optional[bool] = None, 
        is_analyzed: Optional[bool] = None
    ) -> Optional[Dict]:
        notes = self._read_json()
        for note in notes:
            if note["id"] == note_id:
                if title is not None:
                    note["title"] = title
                if body is not None:
                    note["body"] = body
                if folder_id is not None:
                    note["folder_id"] = folder_id
                if is_inspiration is not None:
                    note["is_inspiration"] = is_inspiration
                if is_analyzed is not None:
                    note["is_analyzed"] = is_analyzed
                note["updated_at"] = self._now()
                self._write_json(notes)
                return note
        return None
    
    def get_by_folder(self, folder_id: Optional[str]) -> List[Dict]:
        notes = self._read_json()
        return [n for n in notes if n.get("folder_id") == folder_id]
    
    def get_unorganized(self) -> List[Dict]:
        notes = self._read_json()
        return [n for n in notes if n.get("folder_id") is None]
    
    def bulk_update_folder(self, note_ids: List[str], folder_id: Optional[str]) -> int:
        notes = self._read_json()
        updated_count = 0
        for note in notes:
            if note["id"] in note_ids:
                note["folder_id"] = folder_id
                note["updated_at"] = self._now()
                updated_count += 1
        self._write_json(notes)
        return updated_count
    
    def delete(self, note_id: str) -> bool:
        notes = self._read_json()
        filtered = [n for n in notes if n["id"] != note_id]
        if len(filtered) < len(notes):
            self._write_json(filtered)
            return True
        return False
