from pathlib import Path
from typing import Dict, List, Optional
from repositories.conversation_repo import ConversationRepository
from repositories.folder_repo import FolderRepository
from repositories.note_repo import NoteRepository
from models.llm_client import LLMClient
import json

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
            conversation_id = conversation["id"]
        
        folders = self.folder_repo.get_all()
        selected_folders = self._select_folders(message, folders)
        
        notes = self._get_notes_from_folders(selected_folders)
        
        answer = self._generate_answer(message, notes)
        
        self.conv_repo.add_message(conversation_id, "user", message)
        
        self.conv_repo.add_message(
            conversation_id,
            "assistant",
            answer["answer"],
            metadata={
                "citations": answer.get("citations", []),
                "confidence": answer.get("confidence", 0.0),
                "notes_searched": answer.get("notes_searched", 0)
            }
        )
        
        return {
            "answer": answer["answer"],
            "conversation_id": conversation_id,
            "reasoning": {
                "folders_considered": len(folders),
                "folders_selected": len(selected_folders),
                "notes_searched": len(notes),
                "notes_cited": len(answer.get("citations", []))
            },
            "citations": answer.get("citations", []),
            "confidence": answer.get("confidence", 0.0)
        }

    def _select_folders(self, question: str, folders: List[Dict]) -> List[str]:
        if not folders:
            return []
        
        prompt_template = self._load_prompt("select_folders")
        
        folders_str = json.dumps([{
            "id": f["id"],
            "name": f["name"],
            "description": f.get("description", "")
        } for f in folders], indent=2)
        
        user_prompt = prompt_template.format(
            question=question,
            folders=folders_str
        )
        
        result = self.llm.call(
            system_message="You are an expert at selecting relevant folders for questions.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        return result.get("selected_folder_ids", [f["id"] for f in folders])

    def _get_notes_from_folders(self, folder_ids: List[str]) -> List[Dict]:
        all_notes = self.note_repo.get_all()
        
        relevant_notes = [
            note for note in all_notes
            if note.get("folder_id") in folder_ids
        ]
        
        return relevant_notes

    def _generate_answer(self, question: str, notes: List[Dict]) -> Dict:
        if not notes:
            return {
                "answer": "I couldn't find any relevant notes to answer your question. Try organizing your notes into folders or asking a different question.",
                "citations": [],
                "confidence": 0.0,
                "notes_searched": 0
            }
        
        prompt_template = self._load_prompt("answer_question")
        
        notes_str = "\n\n".join([
            f"Note ID: {note['id']}\nTitle: {note['title']}\nContent: {note['body']}"
            for note in notes
        ])
        
        user_prompt = prompt_template.format(
            question=question,
            notes=notes_str
        )
        
        result = self.llm.call(
            system_message="You are a helpful AI assistant that answers questions based on notes.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        return result

    def get_conversations(self) -> List[Dict]:
        return self.conv_repo.get_all()

    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        return self.conv_repo.get_by_id(conversation_id)

    def delete_conversation(self, conversation_id: str) -> bool:
        return self.conv_repo.delete(conversation_id)