from pathlib import Path
from typing import Dict, List, Optional
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
        notes = self.repo.get_all()
        unorganized = [n for n in notes if n.get('folder_id') is None]
        
        if len(unorganized) == 0:
            return {"message": "All notes are organized!", "new_folders": [], "assignments": []}
        
        existing_folders = self.folder_repo.get_all()
        batch_size = 50
        batches = [unorganized[i:i+batch_size] for i in range(0, len(unorganized), batch_size)]
        
        all_new_folders = {}
        all_assignments = []
        
        for batch_idx, batch in enumerate(batches):
            batch_result = self._process_batch(
                batch, 
                existing_folders, 
                list(all_new_folders.values()),
                batch_idx + 1,
                len(batches)
            )
            
            for folder in batch_result.get('new_folders', []):
                if folder['name'] not in all_new_folders:
                    all_new_folders[folder['name']] = folder
            
            all_assignments.extend(batch_result.get('assignments', []))
        
        return {
            "new_folders": list(all_new_folders.values()),
            "assignments": all_assignments
        }
    
    def _process_batch(self, batch: List[Dict], existing_folders: List[Dict], 
                      accumulated_new_folders: List[Dict], batch_number: int, total_batches: int) -> Dict:
        existing_folder_list = "\n".join([
            f"- {f['name']}: {f.get('description', 'No description')}" 
            for f in existing_folders
        ])
        
        accumulated_folder_list = ""
        if accumulated_new_folders:
            accumulated_folder_list = "\n\nNew folders created in previous batches:\n" + "\n".join([
                f"- {f['name']}: {f.get('description', 'No description')}"
                for f in accumulated_new_folders
            ])
        
        notes_list = "\n".join([
            f"ID: {n['id']}\nTitle: {n['title']}\nContent: {n['body'][:200]}...\n"
            for n in batch
        ])
        
        prompt_template = self._load_prompt("organize_notes")
        user_prompt = prompt_template.format(
            existing_folders=existing_folder_list + accumulated_folder_list,
            notes=notes_list,
            batch_number=batch_number,
            total_batches=total_batches
        )
        
        result = self.llm.call(
            system_message="You are a helpful assistant that organizes notes into folders.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        return result
    
    def apply_organization(self, plan: Dict) -> Dict:
        new_folders_created = {}
        
        for folder_data in plan.get('new_folders', []):
            folder = self.folder_repo.create(
                name=folder_data['name'],
                description=folder_data.get('description'),
                color=folder_data.get('color', '#808080')
            )
            new_folders_created[folder_data['name']] = folder['id']
        
        existing_folders = {f['name']: f['id'] for f in self.folder_repo.get_all()}
        folder_name_to_id = {**existing_folders, **new_folders_created}
        
        notes_organized = 0
        for assignment in plan.get('assignments', []):
            note_id = assignment['note_id']
            folder_name = assignment['folder_name']
            folder_id = folder_name_to_id.get(folder_name)
            
            if folder_id:
                self.repo.update(note_id, folder_id=folder_id)
                notes_organized += 1
        
        return {
            "new_folders_created": len(new_folders_created),
            "notes_organized": notes_organized
        }
