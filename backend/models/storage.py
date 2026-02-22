import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
import uuid


class LocalStorage:
    def __init__(self, base_path: str = "generated"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(exist_ok=True)
        
        self.notes_file = self.base_path / "notes.json"
        self.planner_items_file = self.base_path / "planner_items.json"
        self.inspirations_file = self.base_path / "inspirations.json"
        self.categories_file = self.base_path / "inspiration_categories.json"
        self.links_file = self.base_path / "links.json"
        
        self._init_files()
    
    def _init_files(self) -> None:
        for file in [self.notes_file, self.planner_items_file, self.inspirations_file, 
                     self.categories_file, self.links_file]:
            if not file.exists():
                self._write_json(file, [])
    
    def _read_json(self, file_path: Path) -> List[Dict]:
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def _write_json(self, file_path: Path, data: List[Dict]) -> None:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _generate_id(self) -> str:
        return str(uuid.uuid4())
    
    def _now(self) -> str:
        return datetime.utcnow().isoformat() + 'Z'
    
    # ==================== Notes ====================
    
    def create_note(self, title: str, body: str) -> Dict:
        notes = self._read_json(self.notes_file)
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
        self._write_json(self.notes_file, notes)
        return note
    
    def get_notes(self) -> List[Dict]:
        return self._read_json(self.notes_file)
    
    def get_note(self, note_id: str) -> Optional[Dict]:
        notes = self._read_json(self.notes_file)
        return next((n for n in notes if n["id"] == note_id), None)
    
    def update_note(
        self, 
        note_id: str, 
        title: Optional[str] = None, 
        body: Optional[str] = None, 
        is_inspiration: Optional[bool] = None, 
        is_analyzed: Optional[bool] = None
    ) -> Optional[Dict]:
        notes = self._read_json(self.notes_file)
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
                self._write_json(self.notes_file, notes)
                return note
        return None
    
    def delete_note(self, note_id: str) -> bool:
        notes = self._read_json(self.notes_file)
        filtered = [n for n in notes if n["id"] != note_id]
        if len(filtered) < len(notes):
            self._write_json(self.notes_file, filtered)
            return True
        return False
    
    # ==================== Planner Items ====================
    
    def create_planner_item(
        self, 
        title: str, 
        body: str, 
        date: str, 
        time: Optional[str], 
        view_type: str
    ) -> Dict:
        items = self._read_json(self.planner_items_file)
        item = {
            "id": self._generate_id(),
            "title": title,
            "body": body,
            "date": date,
            "time": time,
            "view_type": view_type,
            "status": "pending",
            "created_at": self._now(),
            "updated_at": self._now()
        }
        items.append(item)
        self._write_json(self.planner_items_file, items)
        return item
    
    def get_planner_items(
        self, 
        date_start: Optional[str] = None, 
        date_end: Optional[str] = None, 
        view_type: Optional[str] = None, 
        status: Optional[str] = None
    ) -> List[Dict]:
        items = self._read_json(self.planner_items_file)
        
        if date_start:
            items = [i for i in items if i["date"] >= date_start]
        if date_end:
            items = [i for i in items if i["date"] <= date_end]
        if view_type:
            items = [i for i in items if i["view_type"] == view_type]
        if status:
            items = [i for i in items if i["status"] == status]
        
        return items
    
    def get_planner_item(self, item_id: str) -> Optional[Dict]:
        items = self._read_json(self.planner_items_file)
        return next((i for i in items if i["id"] == item_id), None)
    
    def update_planner_item(self, item_id: str, **kwargs) -> Optional[Dict]:
        items = self._read_json(self.planner_items_file)
        for item in items:
            if item["id"] == item_id:
                for key, value in kwargs.items():
                    if value is not None and key in item:
                        item[key] = value
                item["updated_at"] = self._now()
                self._write_json(self.planner_items_file, items)
                return item
        return None
    
    def toggle_planner_item_status(self, item_id: str) -> Optional[Dict]:
        items = self._read_json(self.planner_items_file)
        for item in items:
            if item["id"] == item_id:
                item["status"] = "completed" if item["status"] == "pending" else "pending"
                item["updated_at"] = self._now()
                self._write_json(self.planner_items_file, items)
                return item
        return None
    
    def delete_planner_item(self, item_id: str) -> bool:
        items = self._read_json(self.planner_items_file)
        filtered = [i for i in items if i["id"] != item_id]
        if len(filtered) < len(items):
            self._write_json(self.planner_items_file, filtered)
            return True
        return False
    
    # ==================== Inspirations ====================
    
    def create_inspiration(self, note_id: str, category: str, ai_confidence: float) -> Dict:
        inspirations = self._read_json(self.inspirations_file)
        inspiration = {
            "id": self._generate_id(),
            "note_id": note_id,
            "category": category,
            "ai_confidence": ai_confidence,
            "created_at": self._now()
        }
        inspirations.append(inspiration)
        self._write_json(self.inspirations_file, inspirations)
        return inspiration
    
    def get_inspirations(self) -> List[Dict]:
        return self._read_json(self.inspirations_file)
    
    def get_inspirations_by_note(self, note_id: str) -> List[Dict]:
        inspirations = self._read_json(self.inspirations_file)
        return [i for i in inspirations if i["note_id"] == note_id]
    
    def delete_inspiration(self, inspiration_id: str) -> bool:
        inspirations = self._read_json(self.inspirations_file)
        filtered = [i for i in inspirations if i["id"] != inspiration_id]
        if len(filtered) < len(inspirations):
            self._write_json(self.inspirations_file, filtered)
            return True
        return False
    
    # ==================== Categories ====================
    
    def create_category(self, name: str, status: str = "active", discovered_by: str = "user") -> Dict:
        categories = self._read_json(self.categories_file)
        category = {
            "id": self._generate_id(),
            "name": name,
            "status": status,
            "discovered_by": discovered_by,
            "created_at": self._now()
        }
        categories.append(category)
        self._write_json(self.categories_file, categories)
        return category
    
    def get_categories(self, status: Optional[str] = None) -> List[Dict]:
        categories = self._read_json(self.categories_file)
        if status:
            return [c for c in categories if c["status"] == status]
        return categories
    
    def update_category_status(self, category_id: str, status: str) -> Optional[Dict]:
        categories = self._read_json(self.categories_file)
        for category in categories:
            if category["id"] == category_id:
                category["status"] = status
                self._write_json(self.categories_file, categories)
                return category
        return None
    
    def delete_category(self, category_id: str) -> bool:
        categories = self._read_json(self.categories_file)
        filtered = [c for c in categories if c["id"] != category_id]
        if len(filtered) < len(categories):
            self._write_json(self.categories_file, filtered)
            return True
        return False
    
    # ==================== Links ====================
    
    def create_link(self, note_id: str, planner_item_id: str) -> Dict:
        links = self._read_json(self.links_file)
        
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
        self._write_json(self.links_file, links)
        return link
    
    def get_links_by_note(self, note_id: str) -> List[Dict]:
        links = self._read_json(self.links_file)
        return [l for l in links if l["note_id"] == note_id]
    
    def get_links_by_planner_item(self, planner_item_id: str) -> List[Dict]:
        links = self._read_json(self.links_file)
        return [l for l in links if l["planner_item_id"] == planner_item_id]
    
    def delete_link(self, link_id: str) -> bool:
        links = self._read_json(self.links_file)
        filtered = [l for l in links if l["id"] != link_id]
        if len(filtered) < len(links):
            self._write_json(self.links_file, filtered)
            return True
        return False