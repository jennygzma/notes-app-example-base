from pathlib import Path
from typing import Dict, List, Optional
from repositories.note_repo import NoteRepository
from repositories.folder_repo import FolderRepository
from services.folder_service import FolderService
from models.llm_client import LLMClient

class NoteService:
    def __init__(self):
        self.repo = NoteRepository()
        self.folder_repo = FolderRepository()
        self.folder_service = FolderService()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"

    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()

    def create_note(self, title: str, body: str) -> Dict:
        return self.repo.create(title, body)

    def get_notes(self) -> List[Dict]:
        return self.repo.get_all()

    def get_note(self, note_id: str) -> Optional[Dict]:
        return self.repo.get_by_id(note_id)

    def update_note(self, note_id: str, **kwargs) -> Optional[Dict]:
        return self.repo.update(note_id, **kwargs)

    def delete_note(self, note_id: str) -> bool:
        return self.repo.delete(note_id)

    def classify_note(self, note_id: str) -> Optional[Dict]:
        note = self.repo.get_by_id(note_id)
        if not note:
            return None
        
        prompt_template = self._load_prompt("classify_note")
        user_prompt = prompt_template.format(
            title=note['title'],
            body=note['body']
        )
        
        return self.llm.call(
            system_message="You are a helpful assistant that classifies notes as inspiration or tasks.",
            user_prompt=user_prompt,
            use_json=True
        )
    
    def organize_notes_preview(self) -> Dict:
        unorganized = self.repo.get_unorganized()
        
        if len(unorganized) == 0:
            return {"message": "All notes are organized!", "new_folders": [], "existing_assignments": []}
        
        existing_folders = self.folder_repo.get_all()
        
        batches = [unorganized[i:i+50] for i in range(0, len(unorganized), 50)]
        
        all_new_folders = []
        all_existing_assignments = []
        
        for batch in batches:
            batch_result = self._process_organize_batch(batch, existing_folders)
            
            all_new_folders.extend(batch_result.get("new_folders", []))
            all_existing_assignments.extend(batch_result.get("existing_assignments", []))
        
        return {
            "new_folders": all_new_folders,
            "existing_assignments": all_existing_assignments,
            "total_notes": len(unorganized),
            "batches_processed": len(batches)
        }
    
    def _process_organize_batch(self, notes: List[Dict], existing_folders: List[Dict]) -> Dict:
        prompt_template = self._load_prompt("organize_notes")
        
        folders_text = "\n".join([
            f"- {f['name']} (id: {f['id']})" + 
            (f" - {f['description']}" if f.get('description') else "")
            for f in existing_folders
        ]) if existing_folders else "[]"
        
        notes_text = "\n".join([
            f"{i+1}. id: {note['id']}, title: \"{note['title']}\", body: \"{note['body'][:200]}...\""
            for i, note in enumerate(notes)
        ])
        
        user_prompt = f"{prompt_template}\n\nExisting Folders:\n{folders_text}\n\nNotes to organize:\n{notes_text}"
        
        result = self.llm.call(
            system_message="You are a helpful assistant that organizes notes into folders.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        return result
    
    def apply_organization(self, plan: Dict) -> Dict:
        created_folders = []
        updated_notes = []
        
        for new_folder in plan.get("new_folders", []):
            folder = self.folder_service.create_folder(
                name=new_folder["name"],
                description=new_folder.get("description"),
                color=new_folder.get("color")
            )
            created_folders.append(folder)
            
            for note_id in new_folder.get("note_ids", []):
                note = self.repo.update(note_id, folder_id=folder["id"])
                if note:
                    updated_notes.append(note)
        
        for assignment in plan.get("existing_assignments", []):
            folder_id = assignment["folder_id"]
            for note_id in assignment.get("note_ids", []):
                note = self.repo.update(note_id, folder_id=folder_id)
                if note:
                    updated_notes.append(note)
        
        return {
            "created_folders": len(created_folders),
            "updated_notes": len(updated_notes),
            "folders": created_folders
        }
