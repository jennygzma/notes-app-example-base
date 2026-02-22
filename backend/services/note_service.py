from pathlib import Path
from typing import Dict, List, Optional
from repositories.note_repo import NoteRepository
from models.llm_client import LLMClient

class NoteService:
    def __init__(self):
        self.repo = NoteRepository()
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
