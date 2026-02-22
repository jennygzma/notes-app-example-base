import json
import uuid
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
from repositories.base_repo import BaseRepository

class ConversationRepository(BaseRepository):
    def __init__(self, base_path: str = "generated"):
        super().__init__(Path(base_path) / "conversations.json")
    
    def create(self) -> Dict:
        conversation = {
            'id': str(uuid.uuid4()),
            'messages': [],
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        data = self._read_json()
        data.append(conversation)
        self._write_json(data)
        return conversation
    
    def get_by_id(self, conversation_id: str) -> Optional[Dict]:
        data = self._read_json()
        for conv in data:
            if conv['id'] == conversation_id:
                return conv
        return None
    
    def get_all(self) -> List[Dict]:
        return self._read_json()
    
    def add_message(self, conversation_id: str, role: str, content: str, metadata: Optional[Dict] = None) -> Optional[Dict]:
        data = self._read_json()
        for conv in data:
            if conv['id'] == conversation_id:
                message = {
                    'role': role,
                    'content': content,
                    'timestamp': datetime.now().isoformat(),
                    'metadata': metadata or {}
                }
                conv['messages'].append(message)
                conv['updated_at'] = datetime.now().isoformat()
                self._write_json(data)
                return conv
        return None
    
    def delete(self, conversation_id: str) -> bool:
        data = self._read_json()
        filtered = [conv for conv in data if conv['id'] != conversation_id]
        if len(filtered) < len(data):
            self._write_json(filtered)
            return True
        return False