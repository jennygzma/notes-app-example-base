from typing import Dict, List, Optional
from repositories.folder_repo import FolderRepository
from repositories.note_repo import NoteRepository

class FolderService:
    def __init__(self):
        self.repo = FolderRepository()
        self.note_repo = NoteRepository()

    def create_folder(self, name: str, description: Optional[str] = None, color: Optional[str] = "#808080") -> Dict:
        return self.repo.create(name, description, color)

    def get_folders(self) -> List[Dict]:
        return self.repo.get_all()

    def get_folder(self, folder_id: str) -> Optional[Dict]:
        return self.repo.get_by_id(folder_id)

    def update_folder(self, folder_id: str, **kwargs) -> Optional[Dict]:
        return self.repo.update(folder_id, **kwargs)

    def delete_folder(self, folder_id: str) -> bool:
        notes = self.note_repo.get_all()
        for note in notes:
            if note.get("folder_id") == folder_id:
                self.note_repo.update(note["id"], folder_id=None)
        
        return self.repo.delete(folder_id)