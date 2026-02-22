import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any

class BaseRepository:
    def __init__(self, file_path: Path):
        self.file_path = file_path
        self.file_path.parent.mkdir(exist_ok=True)
        self._init_file()

    def _init_file(self) -> None:
        if not self.file_path.exists():
            self._write_json([])

    def _read_json(self) -> List[Dict[str, Any]]:
        with open(self.file_path, 'r') as f:
            return json.load(f)

    def _write_json(self, data: List[Dict[str, Any]]) -> None:
        with open(self.file_path, 'w') as f:
            json.dump(data, f, indent=2)

    def _generate_id(self) -> str:
        return str(uuid.uuid4())

    def _now(self) -> str:
        return datetime.utcnow().isoformat() + 'Z'
