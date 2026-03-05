from pathlib import Path
from typing import Dict, List, Optional
from repositories.note_repo import NoteRepository
from repositories.folder_repo import FolderRepository
from integrations.llm.openai_client import LLMClient
from datetime import datetime
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

    def _normalize_timestamp_to_date(self, timestamp: str) -> str:
        dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d')

    def get_notes_by_activity_date(self, date: str) -> Dict:
        all_notes = self.repo.get_all()
        
        created = []
        updated = []
        moved = []
        
        for note in all_notes:
            activity_history = note.get('activity_history', [])
            
            for activity in activity_history:
                activity_date = self._normalize_timestamp_to_date(activity['timestamp'])
                
                if activity_date == date:
                    if activity['type'] == 'created':
                        created.append(note)
                    elif activity['type'] == 'updated':
                        updated.append(note)
                    elif activity['type'] == 'moved':
                        moved.append(note)
        
        return {
            'date': date,
            'created': created,
            'updated': updated,
            'moved': moved
        }

    def search_notes(self, query: str) -> Dict:
        results = self.repo.search_notes_and_versions(query)
        
        for version in results['version_history']:
            version['is_version_history'] = True
        
        return results

    def get_note_versions(self, note_id: str) -> List[Dict]:
        return self.repo.get_versions(note_id)

    def compute_diff(self, current_content: str, version_content: str) -> List[Dict]:
        current_paragraphs = current_content.split('\n\n')
        version_paragraphs = version_content.split('\n\n')
        
        diff_chunks = []
        max_len = max(len(current_paragraphs), len(version_paragraphs))
        
        for i in range(max_len):
            current_para = current_paragraphs[i] if i < len(current_paragraphs) else ""
            version_para = version_paragraphs[i] if i < len(version_paragraphs) else ""
            
            if current_para == version_para:
                diff_chunks.append({
                    "type": "unchanged",
                    "current": current_para,
                    "version": version_para,
                    "index": i
                })
            elif current_para and not version_para:
                diff_chunks.append({
                    "type": "added",
                    "current": current_para,
                    "version": "",
                    "index": i
                })
            elif not current_para and version_para:
                diff_chunks.append({
                    "type": "removed",
                    "current": "",
                    "version": version_para,
                    "index": i
                })
            else:
                diff_chunks.append({
                    "type": "changed",
                    "current": current_para,
                    "version": version_para,
                    "index": i
                })
        
        return diff_chunks

    def revert_partial(self, note_id: str, version_id: str, paragraph_indices: List[int]) -> Optional[Dict]:
        note = self.repo.get_by_id(note_id)
        version = self.repo.get_version(version_id)
        
        if not note or not version:
            return None
        
        current_paragraphs = note['body'].split('\n\n')
        version_paragraphs = version['content'].split('\n\n')
        
        for idx in paragraph_indices:
            if idx < len(version_paragraphs):
                if idx < len(current_paragraphs):
                    current_paragraphs[idx] = version_paragraphs[idx]
                else:
                    current_paragraphs.append(version_paragraphs[idx])
        
        new_body = '\n\n'.join(current_paragraphs)
        
        self.repo.save_version(note_id)
        
        return self.repo.update(note_id, body=new_body)
