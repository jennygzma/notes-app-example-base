from pathlib import Path
from typing import Dict, List, Optional
from repositories.conversation_repo import ConversationRepository
from repositories.folder_repo import FolderRepository
from repositories.note_repo import NoteRepository
from models.llm_client import LLMClient

class ChatService:
    def __init__(self):
        self.conversation_repo = ConversationRepository()
        self.folder_repo = FolderRepository()
        self.note_repo = NoteRepository()
        self.llm = LLMClient()
        self.prompts_dir = Path(__file__).parent.parent / "prompts"

    def _load_prompt(self, prompt_name: str) -> str:
        prompt_path = self.prompts_dir / f"{prompt_name}.txt"
        with open(prompt_path, 'r') as f:
            return f.read()

    def chat(self, message: str, conversation_id: Optional[str] = None) -> Dict:
        if conversation_id:
            conversation = self.conversation_repo.get_by_id(conversation_id)
            if not conversation:
                conversation = self.conversation_repo.create()
                conversation_id = conversation["id"]
        else:
            conversation = self.conversation_repo.create()
            conversation_id = conversation["id"]
        
        self.conversation_repo.add_message(
            conversation_id=conversation_id,
            role="user",
            content=message
        )
        
        folders = self.folder_repo.get_all()
        selected_folders, folder_reasoning = self._select_folders(message, folders)
        
        notes = self._get_notes_from_folders(selected_folders)
        
        answer_result = self._generate_answer(message, notes)
        
        reasoning = {
            "folders_considered": [{"id": f["id"], "name": f["name"]} for f in folders],
            "folders_selected": [{"id": f["id"], "name": f["name"]} for f in selected_folders],
            "folder_selection_reasoning": folder_reasoning,
            "notes_searched": len(notes),
            "notes_cited": len(answer_result.get("cited_note_ids", []))
        }
        
        self.conversation_repo.add_message(
            conversation_id=conversation_id,
            role="assistant",
            content=answer_result["answer"],
            metadata={
                "reasoning": reasoning,
                "citations": answer_result.get("cited_note_ids", []),
                "has_complete_answer": answer_result.get("has_complete_answer", True),
                "confidence": answer_result.get("confidence", "medium")
            }
        )
        
        return {
            "answer": answer_result["answer"],
            "conversation_id": conversation_id,
            "reasoning": reasoning,
            "citations": self._build_citations(answer_result.get("cited_note_ids", [])),
            "confidence": answer_result.get("confidence", "medium"),
            "has_complete_answer": answer_result.get("has_complete_answer", True)
        }
    
    def _select_folders(self, question: str, folders: List[Dict]) -> tuple[List[Dict], Dict]:
        if not folders:
            return [], {}
        
        folders_list = "\n".join([
            f"ID: {f['id']}\nName: {f['name']}\nDescription: {f.get('description', 'No description')}\n"
            for f in folders
        ])
        
        prompt_template = self._load_prompt("select_folders")
        user_prompt = prompt_template.format(
            question=question,
            folders=folders_list
        )
        
        result = self.llm.call(
            system_message="You are a helpful assistant that selects relevant folders based on user questions.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        selected_folder_ids = result.get("selected_folder_ids", [])
        selected_folders = [f for f in folders if f["id"] in selected_folder_ids]
        
        return selected_folders, result.get("reasoning", {})
    
    def _get_notes_from_folders(self, folders: List[Dict]) -> List[Dict]:
        if not folders:
            all_notes = self.note_repo.get_all()
            return all_notes
        
        folder_ids = [f["id"] for f in folders]
        all_notes = self.note_repo.get_all()
        notes = [n for n in all_notes if n.get("folder_id") in folder_ids]
        
        return notes
    
    def _generate_answer(self, question: str, notes: List[Dict]) -> Dict:
        if not notes:
            return {
                "answer": "I couldn't find any relevant notes to answer your question. Try organizing your notes into folders first, or ask a different question.",
                "cited_note_ids": [],
                "has_complete_answer": False,
                "confidence": "low"
            }
        
        notes_list = "\n".join([
            f"ID: {n['id']}\nTitle: {n['title']}\nContent: {n['body']}\n"
            for n in notes
        ])
        
        prompt_template = self._load_prompt("answer_question")
        user_prompt = prompt_template.format(
            question=question,
            notes=notes_list
        )
        
        result = self.llm.call(
            system_message="You are a helpful assistant that answers questions using only information from the user's notes.",
            user_prompt=user_prompt,
            use_json=True
        )
        
        return result
    
    def _build_citations(self, note_ids: List[str]) -> List[Dict]:
        citations = []
        for note_id in note_ids:
            note = self.note_repo.get_by_id(note_id)
            if note:
                citations.append({
                    "note_id": note["id"],
                    "title": note["title"],
                    "excerpt": note["body"][:200] + "..." if len(note["body"]) > 200 else note["body"]
                })
        return citations
    
    def get_conversations(self) -> List[Dict]:
        return self.conversation_repo.get_all()
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict]:
        return self.conversation_repo.get_by_id(conversation_id)
    
    def delete_conversation(self, conversation_id: str) -> bool:
        return self.conversation_repo.delete(conversation_id)