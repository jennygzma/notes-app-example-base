from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class ConversationRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "conversations.json")

    def create(self) -> Dict:
        conversations = self._read_json()
        conversation = {
            "id": self._generate_id(),
            "messages": [],
            "created_at": self._now(),
            "updated_at": self._now()
        }
        conversations.append(conversation)
        self._write_json(conversations)
        return conversation
    
    def get_all(self) -> List[Dict]:
        return self._read_json()
    
    def get_by_id(self, conversation_id: str) -> Optional[Dict]:
        conversations = self._read_json()
        return next((c for c in conversations if c["id"] == conversation_id), None)
    
    def add_message(
        self, 
        conversation_id: str, 
        role: str, 
        content: str, 
        metadata: Optional[Dict] = None
    ) -> Optional[Dict]:
        conversations = self._read_json()
        for conversation in conversations:
            if conversation["id"] == conversation_id:
                message = {
                    "role": role,
                    "content": content,
                    "timestamp": self._now()
                }
                if metadata:
                    message["metadata"] = metadata
                conversation["messages"].append(message)
                conversation["updated_at"] = self._now()
                self._write_json(conversations)
                return conversation
        return None
    
    def delete(self, conversation_id: str) -> bool:
        conversations = self._read_json()
        filtered = [c for c in conversations if c["id"] != conversation_id]
        if len(filtered) < len(conversations):
            self._write_json(filtered)
            return True
        return False