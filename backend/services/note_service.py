from pathlib import Path
from typing import Dict, List, Optional
from repositories.note_repo import NoteRepository
from repositories.folder_repo import FolderRepository
from models.llm_client import LLMClient
import json

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

    def get_notes_by_activity_date(self, date: str) -> Dict:
        """
        Get notes with activities on the specified date.
        Returns notes grouped by activity type (created, updated, moved).
        
        Args:
            date: Date string in YYYY-MM-DD format
            
        Returns:
            Dict with keys 'created', 'updated', 'moved', each containing list of notes
        """
        all_notes = self.repo.get_all()
        result = {
            "created": [],
            "updated": [],
            "moved": []
        }
        
        for note in all_notes:
            activity_history = note.get("activity_history", [])
            
            for activity in activity_history:
                # Extract date from timestamp (format: YYYY-MM-DDTHH:MM:SS.ffffff)
                activity_date = activity.get("timestamp", "").split("T")[0]
                
                if activity_date == date:
                    activity_type = activity.get("type")
                    if activity_type in result:
                        # Add note with activity details
                        note_with_activity = {
                            **note,
                            "activity_timestamp": activity.get("timestamp"),
                            "activity_details": activity.get("details", {})
                        }
                        result[activity_type].append(note_with_activity)
        
        return result

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
        unorganized = [note for note in self.repo.get_all() if note.get('folder_id') is None]
        
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
            "existing_assignments": all_existing_assignments
        }

    def _process_organize_batch(self, notes: List[Dict], existing_folders: List[Dict]) -> Dict:
        prompt_template = self._load_prompt("organize_notes")
        
        folders_str = json.dumps([{
            "id": f["id"],
            "name": f["name"],
            "description": f.get("description", "")
        } for f in existing_folders], indent=2)
        
        notes_str = "\n".join([
            f"- ID: {note['id']}\n  Title: {note['title']}\n  Body: {note['body'][:200]}{'...' if len(note['body']) > 200 else ''}"
            for note in notes
        ])
        
        user_prompt = prompt_template.format(
            existing_folders=folders_str,
            notes=notes_str
        )
        
        result = self.llm.call(
            system_message="You are an expert at organizing notes into logical folders.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        return result

    def apply_organization(self, plan: Dict) -> Dict:
        created_folders = []
        updated_notes = []
        
        for new_folder in plan.get("new_folders", []):
            folder = self.folder_repo.create(
                name=new_folder["name"],
                description=new_folder.get("description", ""),
                color=new_folder.get("color", "#808080")
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
