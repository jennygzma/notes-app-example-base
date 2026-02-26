from pathlib import Path
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository
import uuid
from datetime import datetime

class ConversationRepository(BaseRepository):
    def __init__(self):
        base_path = Path(__file__).parent.parent / "generated"
        super().__init__(Path(base_path) / "conversations.json")

    def create(self) -> Dict:
        conversation = {
            "id": str(uuid.uuid4()),
            "messages": [],
            "created_at": datetime.utcnow().isoformat() + "Z",
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        
        data = self._read_json()
        data.append(conversation)
        self._write_json(data)
        
        return conversation

    def get_by_id(self, conversation_id: str) -> Optional[Dict]:
        data = self._read_json()
        for conv in data:
            if conv["id"] == conversation_id:
                return conv
        return None

    def add_message(self, conversation_id: str, role: str, content: str, metadata: Optional[Dict] = None) -> Optional[Dict]:
        data = self._read_json()
        
        for conv in data:
            if conv["id"] == conversation_id:
                message = {
                    "role": role,
                    "content": content,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                if metadata:
                    message["metadata"] = metadata
                
                conv["messages"].append(message)
                conv["updated_at"] = datetime.utcnow().isoformat() + "Z"
                self._write_json(data)
                return conv
        
        return None

    def get_all(self) -> List[Dict]:
        data = self._read_json()
        return sorted(data, key=lambda x: x["updated_at"], reverse=True)

    def delete(self, conversation_id: str) -> bool:
        data = self._read_json()
        original_length = len(data)
        data = [conv for conv in data if conv["id"] != conversation_id]
        
        if len(data) < original_length:
            self._write_json(data)
            return True
        return False