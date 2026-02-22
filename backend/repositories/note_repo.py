from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class NoteRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "notes.json")

    def create(self, title: str, body: str) -> Dict:
        notes = self._read_json()
        note = {
            "id": self._generate_id(),
            "title": title,
            "body": body,
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
                if is_inspiration is not None:
                    note["is_inspiration"] = is_inspiration
                if is_analyzed is not None:
                    note["is_analyzed"] = is_analyzed
                note["updated_at"] = self._now()
                self._write_json(notes)
                return note
        return None
    
    def delete(self, note_id: str) -> bool:
        notes = self._read_json()
        filtered = [n for n in notes if n["id"] != note_id]
        if len(filtered) < len(notes):
            self._write_json(filtered)
            return True
        return False
