from pathlib import Path
from typing import Dict, List, Optional
import json
from repositories.note_repo import NoteRepository
from repositories.folder_repo import FolderRepository
from models.llm_client import LLMClient

class NoteService:
    def __init__(self):
        self.repo = NoteRepository()
        self.folder_repo = FolderRepository()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"

    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()

    def create_note(self, title: str, body: str, folder_id: Optional[str] = None) -> Dict:
        return self.repo.create(title, body, folder_id)

    def get_notes(self) -> List[Dict]:
        return self.repo.get_all()

    def get_note(self, note_id: str) -> Optional[Dict]:
        return self.repo.get_by_id(note_id)

    def update_note(self, note_id: str, **kwargs) -> Optional[Dict]:
        return self.repo.update(note_id, **kwargs)

    def bulk_move_notes(self, note_ids: List[str], folder_id: Optional[str]) -> int:
        return self.repo.bulk_update_folder(note_ids, folder_id)

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
            return {
                "message": "All notes are organized!",
                "proposed_folders": [],
                "existing_folder_assignments": []
            }
        
        existing_folders = self.folder_repo.get_all()
        batch_size = 50
        batches = [unorganized[i:i+batch_size] for i in range(0, len(unorganized), batch_size)]
        
        all_new_folders = []
        all_existing_assignments = []
        
        for batch in batches:
            result = self._process_batch(batch, existing_folders)
            all_new_folders.extend(result.get("new_folders", []))
            all_existing_assignments.extend(result.get("existing_folder_assignments", []))
        
        return {
            "total_notes": len(unorganized),
            "batches_processed": len(batches),
            "proposed_folders": all_new_folders,
            "existing_folder_assignments": all_existing_assignments
        }
    
    def _process_batch(self, notes: List[Dict], existing_folders: List[Dict]) -> Dict:
        prompt_template = self._load_prompt("organize_notes")
        
        existing_folders_str = "\n".join([
            f"- {f['name']} (ID: {f['id']}): {f.get('description', 'No description')}"
            for f in existing_folders
        ])
        
        notes_str = "\n".join([
            f"ID: {n['id']}\nTitle: {n['title']}\nContent: {n['body'][:200]}...\n"
            for n in notes
        ])
        
        user_prompt = prompt_template.format(
            existing_folders=existing_folders_str if existing_folders else "No existing folders",
            notes_batch=notes_str
        )
        
        try:
            result = self.llm.call(
                system_message="You are a note organization assistant. Return only valid JSON.",
                user_prompt=user_prompt,
                use_json=True
            )
            return result
        except json.JSONDecodeError:
            return {"new_folders": [], "existing_folder_assignments": []}
    
    def apply_organization(self, plan: Dict) -> Dict:
        created_folders = []
        updated_notes = 0
        
        folder_id_map = {}
        for new_folder in plan.get("proposed_folders", []):
            folder = self.folder_repo.create(
                name=new_folder["name"],
                description=new_folder.get("description"),
                color=new_folder.get("color", "#808080")
            )
            created_folders.append(folder)
            folder_id_map[new_folder["name"]] = folder["id"]
            
            note_ids = new_folder.get("note_ids", [])
            if note_ids:
                count = self.repo.bulk_update_folder(note_ids, folder["id"])
                updated_notes += count
        
        for assignment in plan.get("existing_folder_assignments", []):
            folder_id = assignment["folder_id"]
            note_ids = assignment.get("note_ids", [])
            if note_ids:
                count = self.repo.bulk_update_folder(note_ids, folder_id)
                updated_notes += count
        
        return {
            "folders_created": len(created_folders),
            "notes_organized": updated_notes,
            "created_folders": created_folders
        }
