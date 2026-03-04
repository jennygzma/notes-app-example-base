import requests
from typing import Dict
from integrations.google.auth import GoogleAuthService


class GoogleTasksService:
    def __init__(self):
        self.auth = GoogleAuthService()
        self.base_url = "https://tasks.googleapis.com/tasks/v1"

    def _headers(self) -> Dict[str, str]:
        token = self.auth.get_valid_access_token()
        if not token:
            raise ValueError("Missing Google access token")
        return {"Authorization": f"Bearer {token}"}

    def fetch_google_tasks(self) -> Dict:
        url = f"{self.base_url}/lists/@default/tasks"
        response = requests.get(url, headers=self._headers(), timeout=30)
        response.raise_for_status()
        return response.json()

    def create_google_task(self, task: Dict) -> Dict:
        url = f"{self.base_url}/lists/@default/tasks"
        payload = {
            "title": task.get("title"),
        }
        if task.get("due_date"):
            payload["due"] = self._format_due(task["due_date"])
        if task.get("completed"):
            payload["status"] = "completed"
        response = requests.post(url, headers=self._headers(), json=payload, timeout=30)
        response.raise_for_status()
        return response.json()

    def update_google_task(self, task: Dict) -> Dict:
        google_task_id = task.get("google_task_id")
        if not google_task_id:
            raise ValueError("Missing google_task_id")
        url = f"{self.base_url}/lists/@default/tasks/{google_task_id}"
        payload = {}
        if "title" in task:
            payload["title"] = task["title"]
        if "completed" in task:
            payload["status"] = "completed" if task["completed"] else "needsAction"
        if "due_date" in task and task["due_date"]:
            payload["due"] = self._format_due(task["due_date"])
        response = requests.patch(url, headers=self._headers(), json=payload, timeout=30)
        response.raise_for_status()
        return response.json()

    def delete_google_task(self, google_task_id: str) -> Dict:
        url = f"{self.base_url}/lists/@default/tasks/{google_task_id}"
        response = requests.delete(url, headers=self._headers(), timeout=30)
        response.raise_for_status()
        return {"deleted": True}
