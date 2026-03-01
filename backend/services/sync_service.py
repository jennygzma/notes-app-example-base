from typing import Dict
from integrations.google.tasks import GoogleTasksService


class SyncService:
    def __init__(self):
        self.google = GoogleTasksService()

    def sync_google_tasks(self) -> Dict:
        return {"status": "not_implemented"}
