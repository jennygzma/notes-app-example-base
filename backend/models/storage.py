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
        self.settings_file = self.base_path / "settings.json"
        
        self._init_files()
    
    def _init_files(self):
        for file in [self.notes_file, self.planner_items_file, self.inspirations_file, 
                     self.categories_file, self.links_file]:
            if not file.exists():
                self._write_json(file, [])
        
        # Initialize settings with default theme
        if not self.settings_file.exists():
            default_settings = {
                "activeTheme": "default",
                "themes": {
                    "default": {
                        "name": "Default",
                        "colors": {
                            "primary": "#1976d2",
                            "secondary": "#dc004e",
                            "background": "#ffffff",
                            "text": "#000000"
                        },
                        "font": "Roboto"
                    }
                }
            }
            with open(self.settings_file, 'w') as f:
                json.dump(default_settings, f, indent=2)
    
    def _read_json(self, file_path: Path) -> List[Dict]:
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def _write_json(self, file_path: Path, data: List[Dict]):
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _generate_id(self) -> str:
        return str(uuid.uuid4())
    
    def _now(self) -> str:
        return datetime.utcnow().isoformat() + 'Z'
    
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
    
    def update_note(self, note_id: str, title: Optional[str] = None, body: Optional[str] = None, 
                    is_inspiration: Optional[bool] = None, is_analyzed: Optional[bool] = None) -> Optional[Dict]:
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
    
    def create_planner_item(self, title: str, body: str, date: str, time: Optional[str], view_type: str) -> Dict:
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
    
    def get_planner_items(self, date_start: Optional[str] = None, date_end: Optional[str] = None, 
                         view_type: Optional[str] = None, status: Optional[str] = None) -> List[Dict]:
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
    
    def create_link(self, note_id: str, planner_item_id: str) -> Dict:
        links = self._read_json(self.links_file)
        
        existing = next((l for l in links if l["note_id"] == note_id and l["planner_item_id"] == planner_item_id), None)
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
    
    # Settings methods
    def get_settings(self) -> Dict:
        """Get all settings including active theme and all themes"""
        with open(self.settings_file, 'r') as f:
            return json.load(f)
    
    def update_active_theme(self, theme_id: str) -> Dict:
        """Set the active theme by ID"""
        settings = self.get_settings()
        if theme_id not in settings["themes"]:
            raise ValueError(f"Theme '{theme_id}' does not exist")
        settings["activeTheme"] = theme_id
        with open(self.settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        return settings
    
    def create_theme(self, theme_data: Dict) -> str:
        """Create a new theme and return its ID"""
        settings = self.get_settings()
        theme_id = self._generate_id()
        settings["themes"][theme_id] = theme_data
        with open(self.settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        return theme_id
    
    def update_theme(self, theme_id: str, theme_data: Dict) -> Dict:
        """Update an existing theme"""
        settings = self.get_settings()
        if theme_id not in settings["themes"]:
            raise ValueError(f"Theme '{theme_id}' does not exist")
        settings["themes"][theme_id] = theme_data
        with open(self.settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        return settings
    
    def delete_theme(self, theme_id: str) -> bool:
        """Delete a theme (cannot delete default theme)"""
        if theme_id == "default":
            raise ValueError("Cannot delete the default theme")
        
        settings = self.get_settings()
        if theme_id not in settings["themes"]:
            return False
        
        # If deleting the active theme, switch to default
        if settings["activeTheme"] == theme_id:
            settings["activeTheme"] = "default"
        
        del settings["themes"][theme_id]
        with open(self.settings_file, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    
    def reset_to_default(self) -> Dict:
        """Reset to default theme only, removing all custom themes"""
        default_settings = {
            "activeTheme": "default",
            "themes": {
                "default": {
                    "name": "Default",
                    "colors": {
                        "primary": "#1976d2",
                        "secondary": "#dc004e",
                        "background": "#ffffff",
                        "text": "#000000"
                    },
                    "font": "Roboto"
                }
            }
        }
        with open(self.settings_file, 'w') as f:
            json.dump(default_settings, f, indent=2)
        return default_settings
