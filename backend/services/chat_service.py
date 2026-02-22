from pathlib import Path
from typing import Dict, List, Optional
from repositories.conversation_repo import ConversationRepository
from repositories.folder_repo import FolderRepository
from repositories.note_repo import NoteRepository
from models.llm_client import LLMClient

class ChatService:
    def __init__(self):
        self.conv_repo = ConversationRepository()
        self.folder_repo = FolderRepository()
        self.note_repo = NoteRepository()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"
    
    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()
    
    def chat(self, message: str, conversation_id: Optional[str] = None) -> Dict:
        if not conversation_id:
            conversation = self.conv_repo.create()
            conversation_id = conversation['id']
        
        self.conv_repo.add_message(conversation_id, 'user', message)
        
        folders = self.folder_repo.get_all()
        
        selected_folders = self._select_folders(message, folders)
        
        notes = self._get_notes_from_folders(selected_folders['selected_folder_ids'])
        
        answer = self._generate_answer(message, notes)
        
        reasoning = {
            'folders_considered': [{'id': f['id'], 'name': f['name']} for f in folders],
            'folders_selected': [{'id': f['id'], 'name': f['name']} for f in folders if f['id'] in selected_folders['selected_folder_ids']],
            'folder_selection_reasoning': selected_folders['reasoning'],
            'notes_searched': len(notes),
            'notes_cited': len(answer['cited_note_ids']),
            'confidence': answer.get('confidence', 'medium')
        }
        
        self.conv_repo.add_message(
            conversation_id,
            'assistant',
            answer['answer'],
            metadata={
                'reasoning': reasoning,
                'citations': answer['cited_note_ids']
            }
        )
        
        return {
            'answer': answer['answer'],
            'conversation_id': conversation_id,
            'reasoning': reasoning,
            'citations': self._build_citations(answer['cited_note_ids'], notes)
        }
    
    def _select_folders(self, question: str, folders: List[Dict]) -> Dict:
        prompt_template = self._load_prompt("select_folders")
        
        folders_text = "\n".join([
            f"- {f['name']} (id: {f['id']})" +
            (f" - {f['description']}" if f.get('description') else "")
            for f in folders
        ])
        
        user_prompt = f"{prompt_template}\n\nAvailable Folders:\n{folders_text}\n\nUser Question: \"{question}\""
        
        result = self.llm.call(
            system_message="You are a helpful assistant that selects relevant folders to search.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        if not result.get('selected_folder_ids'):
            result['selected_folder_ids'] = [f['id'] for f in folders[:2]]
            result['reasoning'] = "Defaulting to first available folders"
        
        return result
    
    def _get_notes_from_folders(self, folder_ids: List[str]) -> List[Dict]:
        all_notes = self.note_repo.get_all()
        
        filtered_notes = [
            note for note in all_notes
            if note.get('folder_id') in folder_ids
        ]
        
        return filtered_notes[:20]
    
    def _generate_answer(self, question: str, notes: List[Dict]) -> Dict:
        prompt_template = self._load_prompt("answer_question")
        
        notes_text = "\n".join([
            f"{i+1}. id: {note['id']}, title: \"{note['title']}\", body: \"{note['body'][:300]}...\""
            for i, note in enumerate(notes)
        ])
        
        if not notes_text:
            notes_text = "(No notes found in selected folders)"
        
        user_prompt = f"{prompt_template}\n\nUser Question: \"{question}\"\n\nNotes:\n{notes_text}"
        
        result = self.llm.call(
            system_message="You are a helpful assistant that answers questions based on provided notes.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        if not result.get('answer'):
            result['answer'] = "I couldn't generate an answer from the available notes."
            result['cited_note_ids'] = []
            result['confidence'] = 'low'
        
        return result
    
    def _build_citations(self, note_ids: List[str], notes: List[Dict]) -> List[Dict]:
        citations = []
        for note_id in note_ids:
            note = next((n for n in notes if n['id'] == note_id), None)
            if note:
                citations.append({
                    'note_id': note['id'],
                    'title': note['title'],
                    'excerpt': note['body'][:200] + '...' if len(note['body']) > 200 else note['body']
                })
        return citations
    
    def get_conversations(self) -> List[Dict]:
        conversations = self.conv_repo.get_all()
        return sorted(conversations, key=lambda c: c['updated_at'], reverse=True)
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        return self.conv_repo.get_by_id(conversation_id)
    
    def delete_conversation(self, conversation_id: str) -> bool:
        return self.conv_repo.delete(conversation_id)