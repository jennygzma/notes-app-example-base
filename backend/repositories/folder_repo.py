from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class FolderRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "folders.json")

    def create(self, name: str, description: Optional[str] = None, color: Optional[str] = "#808080") -> Dict:
        folders = self._read_json()
        folder = {
            "id": self._generate_id(),
            "name": name,
            "description": description,
            "color": color,
            "created_at": self._now(),
            "updated_at": self._now()
        }
        folders.append(folder)
        self._write_json(folders)
        return folder
    
    def get_all(self) -> List[Dict]:
        return self._read_json()
    
    def get_by_id(self, folder_id: str) -> Optional[Dict]:
        folders = self._read_json()
        return next((f for f in folders if f["id"] == folder_id), None)
    
    def update(
        self, 
        folder_id: str, 
        name: Optional[str] = None,
        description: Optional[str] = None,
        color: Optional[str] = None
    ) -> Optional[Dict]:
        folders = self._read_json()
        for folder in folders:
            if folder["id"] == folder_id:
                if name is not None:
                    folder["name"] = name
                if description is not None:
                    folder["description"] = description
                if color is not None:
                    folder["color"] = color
                folder["updated_at"] = self._now()
                self._write_json(folders)
                return folder
        return None
    
    def delete(self, folder_id: str) -> bool:
        folders = self._read_json()
        filtered = [f for f in folders if f["id"] != folder_id]
        if len(filtered) < len(folders):
            self._write_json(filtered)
            return True
        return False