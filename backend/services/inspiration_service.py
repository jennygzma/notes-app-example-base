from pathlib import Path
from typing import Dict, List, Optional, Tuple
from repositories.inspiration_repo import InspirationRepository
from repositories.note_repo import NoteRepository
from models.llm_client import LLMClient
from schemas import CategorizeResponse

class InspirationService:
    def __init__(self):
        self.repo = InspirationRepository()
        self.note_repo = NoteRepository()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"

    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()

    def get_all_grouped(self) -> Dict:
        inspirations = self.repo.get_all()
        notes = self.note_repo.get_all()
        
        result = {}
        for insp in inspirations:
            note = next((n for n in notes if n['id'] == insp['note_id']), None)
            if note:
                category = insp['category']
                if category not in result:
                    result[category] = []
                result[category].append({
                    **note,
                    'inspiration_id': insp['id'],
                    'ai_confidence': insp['ai_confidence']
                })
        return result

    def get_by_note_id(self, note_id: str) -> List[Dict]:
        return self.repo.get_by_note_id(note_id)
    
    def delete_inspiration(self, inspiration_id: str) -> bool:
        return self.repo.delete(inspiration_id)

    # Categories
    def get_categories(self, status: Optional[str] = None) -> List[Dict]:
        return self.repo.get_categories(status)

    def reject_category(self, category_id: str) -> bool:
        return self.repo.delete_category(category_id)
    
    def approve_category(self, category_id: str, note_id: Optional[str]) -> Tuple[Optional[Dict], Optional[Dict]]:
        category = self.repo.update_category_status(category_id, "active")
        inspiration = None
        if category and note_id:
            note = self.note_repo.get_by_id(note_id)
            if note:
                inspiration = self.repo.create(
                    note_id=note_id,
                    category=category['name'],
                    ai_confidence=0.95
                )
                self.note_repo.update(note_id, is_inspiration=True, is_analyzed=True)
        return category, inspiration

    # AI Logic
    def categorize_note(self, note_id: str) -> Optional[CategorizeResponse]:
        note = self.note_repo.get_by_id(note_id)
        if not note:
            return None
        
        active_categories = self.repo.get_categories(status="active")
        category_names = [c['name'] for c in active_categories]
        
        prompt_template = self._load_prompt("categorize_note")
        user_prompt = prompt_template.format(
            title=note['title'],
            body=note['body'],
            existing_categories=', '.join(category_names) if category_names else 'None yet'
        )
        
        result = self.llm.call(
            system_message="You are a helpful assistant that categorizes inspiration notes.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        is_new = result['is_new_category']
        category_name = result['category']
        
        if is_new:
            category = self.repo.create_category(
                name=category_name,
                status="pending_approval",
                discovered_by="ai"
            )
            return CategorizeResponse(
                category=category_name,
                confidence=result['confidence'],
                is_new_category=True,
                category_id=category['id'],
                reasoning=result.get('reasoning'),
                status="pending_approval"
            )
        else:
            inspiration = self.repo.create(
                note_id=note_id,
                category=category_name,
                ai_confidence=result['confidence']
            )
            # Mark note as inspiration and analyzed
            self.note_repo.update(note_id, is_inspiration=True, is_analyzed=True)
            
            return CategorizeResponse(
                category=category_name,
                confidence=result['confidence'],
                is_new_category=False,
                inspiration_id=inspiration['id'],
                reasoning=result.get('reasoning'),
                status="created"
            )
