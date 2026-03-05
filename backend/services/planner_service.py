from pathlib import Path
from typing import Dict, List, Optional
from repositories.planner_repo import PlannerRepository
from repositories.note_repo import NoteRepository
from integrations.llm.openai_client import LLMClient

class PlannerService:
    def __init__(self):
        self.repo = PlannerRepository()
        self.note_repo = NoteRepository()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"

    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()

    def create_item(self, **kwargs) -> Dict:
        return self.repo.create(**kwargs)
    
    def get_items(self, **kwargs) -> List[Dict]:
        return self.repo.get_all(**kwargs)

    def get_item(self, item_id: str) -> Optional[Dict]:
        return self.repo.get_by_id(item_id)

    def update_item(self, item_id: str, **kwargs) -> Optional[Dict]:
        return self.repo.update(item_id, **kwargs)

    def delete_item(self, item_id: str) -> bool:
        return self.repo.delete(item_id)
    
    def toggle_status(self, item_id: str) -> Optional[Dict]:
        return self.repo.toggle_status(item_id)

    def translate_note_to_task(self, note_id: str) -> Optional[Dict]:
        note = self.note_repo.get_by_id(note_id)
        if not note:
            return None
            
        prompt_template = self._load_prompt("translate_to_planner")
        user_prompt = prompt_template.format(
            title=note['title'],
            body=note['body']
        )
        
        return self.llm.call(
            system_message="You are a helpful assistant that converts notes into planner tasks.",
            user_prompt=user_prompt,
            use_json=True
        )
