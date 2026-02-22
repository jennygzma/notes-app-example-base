from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class LinkRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "links.json")

    def create(self, note_id: str, planner_item_id: str) -> Dict:
        links = self._read_json()
        
        # Check if link already exists
        existing = next(
            (l for l in links if l["note_id"] == note_id and l["planner_item_id"] == planner_item_id), 
            None
        )
        if existing:
            return existing
        
        link = {
            "id": self._generate_id(),
            "note_id": note_id,
            "planner_item_id": planner_item_id,
            "created_at": self._now()
        }
        links.append(link)
        self._write_json(links)
        return link
    
    def get_by_note_id(self, note_id: str) -> List[Dict]:
        links = self._read_json()
        return [l for l in links if l["note_id"] == note_id]
    
    def get_by_planner_item_id(self, planner_item_id: str) -> List[Dict]:
        links = self._read_json()
        return [l for l in links if l["planner_item_id"] == planner_item_id]
    
    def delete(self, link_id: str) -> bool:
        links = self._read_json()
        filtered = [l for l in links if l["id"] != link_id]
        if len(filtered) < len(links):
            self._write_json(filtered)
            return True
        return False
