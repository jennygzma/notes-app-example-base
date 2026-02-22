from pathlib import Path
from typing import Dict, List, Optional
import json
from repositories.note_repo import NoteRepository
from repositories.folder_repo import FolderRepository
from models.llm_client import LLMClient

class ChatService:
    def __init__(self):
        self.note_repo = NoteRepository()
        self.folder_repo = FolderRepository()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"
    
    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()
    
    def chat(self, question: str) -> Dict:
        folders = self.folder_repo.get_all()
        
        if len(folders) == 0:
            all_notes = self.note_repo.get_all()
            return self._answer_with_notes(question, all_notes, None)
        
        folder_selection = self._select_folders(question, folders)
        
        selected_folder_ids = folder_selection.get("selected_folder_ids", [])
        
        if not selected_folder_ids:
            all_notes = self.note_repo.get_all()
            relevant_notes = all_notes[:50]
        else:
            relevant_notes = []
            for folder_id in selected_folder_ids:
                notes = self.note_repo.get_by_folder(folder_id)
                relevant_notes.extend(notes)
        
        answer_result = self._answer_with_notes(question, relevant_notes, folder_selection)
        
        return {
            "answer": answer_result["answer"],
            "cited_note_ids": answer_result["cited_note_ids"],
            "confidence": answer_result["confidence"],
            "has_sufficient_info": answer_result.get("has_sufficient_info", True),
            "reasoning": {
                "folder_selection": folder_selection.get("reasoning", "No folders available"),
                "selected_folder_ids": selected_folder_ids,
                "folders_searched": [
                    {
                        "id": f["id"],
                        "name": f["name"]
                    }
                    for f in folders if f["id"] in selected_folder_ids
                ] if selected_folder_ids else [],
                "notes_searched": len(relevant_notes)
            }
        }
    
    def _select_folders(self, question: str, folders: List[Dict]) -> Dict:
        prompt_template = self._load_prompt("select_folders")
        
        folders_str = "\n".join([
            f"ID: {f['id']}\nName: {f['name']}\nDescription: {f.get('description', 'No description')}\nNote Count: {f.get('note_count', 0)}\n"
            for f in folders
        ])
        
        user_prompt = prompt_template.format(
            question=question,
            folders=folders_str
        )
        
        try:
            result = self.llm.call(
                system_message="You are a folder selection assistant. Return only valid JSON.",
                user_prompt=user_prompt,
                use_json=True
            )
            return result
        except (json.JSONDecodeError, Exception):
            return {
                "reasoning": "Unable to select folders",
                "selected_folder_ids": [],
                "confidence": 0.0
            }
    
    def _answer_with_notes(self, question: str, notes: List[Dict], folder_selection: Optional[Dict]) -> Dict:
        prompt_template = self._load_prompt("answer_with_notes")
        
        notes_str = "\n\n".join([
            f"Note ID: {n['id']}\nTitle: {n['title']}\nContent: {n['body'][:500]}"
            for n in notes[:20]
        ])
        
        user_prompt = prompt_template.format(
            question=question,
            notes=notes_str if notes else "No notes available"
        )
        
        try:
            result = self.llm.call(
                system_message="You are a helpful assistant that answers questions using only the provided notes.",
                user_prompt=user_prompt,
                use_json=True
            )
            return result
        except (json.JSONDecodeError, Exception) as e:
            return {
                "answer": f"I encountered an error processing your question: {str(e)}",
                "cited_note_ids": [],
                "confidence": 0.0,
                "has_sufficient_info": False
            }