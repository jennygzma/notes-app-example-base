import json
from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class InspirationRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "inspirations.json")
        self.categories_file = Path(base_path) / "inspiration_categories.json"
        if not self.categories_file.exists():
            self._write_json_to_file(self.categories_file, [])

    # Helper for secondary file
    def _read_json_from_file(self, file_path: Path) -> List[Dict]:
        with open(file_path, 'r') as f:
            return json.load(f)

    def _write_json_to_file(self, file_path: Path, data: List[Dict]) -> None:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)

    # ==================== Inspirations ====================
    
    def create(self, note_id: str, category: str, ai_confidence: float) -> Dict:
        inspirations = self._read_json()
        inspiration = {
            "id": self._generate_id(),
            "note_id": note_id,
            "category": category,
            "ai_confidence": ai_confidence,
            "created_at": self._now()
        }
        inspirations.append(inspiration)
        self._write_json(inspirations)
        return inspiration
    
    def get_all(self) -> List[Dict]:
        return self._read_json()
    
    def get_by_note_id(self, note_id: str) -> List[Dict]:
        inspirations = self._read_json()
        return [i for i in inspirations if i["note_id"] == note_id]
    
    def delete(self, inspiration_id: str) -> bool:
        inspirations = self._read_json()
        filtered = [i for i in inspirations if i["id"] != inspiration_id]
        if len(filtered) < len(inspirations):
            self._write_json(filtered)
            return True
        return False

    # ==================== Categories ====================

    def create_category(self, name: str, status: str = "active", discovered_by: str = "user") -> Dict:
        categories = self._read_json_from_file(self.categories_file)
        category = {
            "id": self._generate_id(),
            "name": name,
            "status": status,
            "discovered_by": discovered_by,
            "created_at": self._now()
        }
        categories.append(category)
        self._write_json_to_file(self.categories_file, categories)
        return category
    
    def get_categories(self, status: Optional[str] = None) -> List[Dict]:
        categories = self._read_json_from_file(self.categories_file)
        if status:
            return [c for c in categories if c["status"] == status]
        return categories
    
    def update_category_status(self, category_id: str, status: str) -> Optional[Dict]:
        categories = self._read_json_from_file(self.categories_file)
        for category in categories:
            if category["id"] == category_id:
                category["status"] = status
                self._write_json_to_file(self.categories_file, categories)
                return category
        return None
    
    def delete_category(self, category_id: str) -> bool:
        categories = self._read_json_from_file(self.categories_file)
        filtered = [c for c in categories if c["id"] != category_id]
        if len(filtered) < len(categories):
            self._write_json_to_file(self.categories_file, filtered)
            return True
        return False
