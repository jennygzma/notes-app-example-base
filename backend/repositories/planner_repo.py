from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class PlannerRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "planner_items.json")

    def create(
        self, 
        title: str, 
        body: str, 
        date: str, 
        time: Optional[str], 
        view_type: str
    ) -> Dict:
        items = self._read_json()
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
        self._write_json(items)
        return item
    
    def get_all(
        self, 
        date_start: Optional[str] = None, 
        date_end: Optional[str] = None, 
        view_type: Optional[str] = None, 
        status: Optional[str] = None
    ) -> List[Dict]:
        items = self._read_json()
        
        if date_start:
            items = [i for i in items if i["date"] >= date_start]
        if date_end:
            items = [i for i in items if i["date"] <= date_end]
        if view_type:
            items = [i for i in items if i["view_type"] == view_type]
        if status:
            items = [i for i in items if i["status"] == status]
        
        return items
    
    def get_by_id(self, item_id: str) -> Optional[Dict]:
        items = self._read_json()
        return next((i for i in items if i["id"] == item_id), None)
    
    def update(self, item_id: str, **kwargs) -> Optional[Dict]:
        items = self._read_json()
        for item in items:
            if item["id"] == item_id:
                for key, value in kwargs.items():
                    if value is not None and key in item:
                        item[key] = value
                item["updated_at"] = self._now()
                self._write_json(items)
                return item
        return None
    
    def toggle_status(self, item_id: str) -> Optional[Dict]:
        items = self._read_json()
        for item in items:
            if item["id"] == item_id:
                item["status"] = "completed" if item["status"] == "pending" else "pending"
                item["updated_at"] = self._now()
                self._write_json(items)
                return item
        return None
    
    def delete(self, item_id: str) -> bool:
        items = self._read_json()
        filtered = [i for i in items if i["id"] != item_id]
        if len(filtered) < len(items):
            self._write_json(filtered)
            return True
        return False
