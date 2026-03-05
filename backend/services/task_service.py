from typing import Dict, List, Optional
from repositories.task_repo import TaskRepository


class TaskService:
    def __init__(self):
        self.repo = TaskRepository()

    def create_task(self, title: str, completed: bool = False, due_date: Optional[str] = None) -> Dict:
        return self.repo.create(title=title, completed=completed, due_date=due_date)

    def get_tasks(self) -> List[Dict]:
        return self.repo.get_all()

    def get_task(self, task_id: str) -> Optional[Dict]:
        return self.repo.get_by_id(task_id)

    def update_task(
        self,
        task_id: str,
        title: Optional[str] = None,
        completed: Optional[bool] = None,
        due_date: Optional[str] = None,
        google_task_id: Optional[str] = None,
        last_synced_at: Optional[str] = None,
    ) -> Optional[Dict]:
        return self.repo.update(
            task_id=task_id,
            title=title,
            completed=completed,
            due_date=due_date,
            google_task_id=google_task_id,
            last_synced_at=last_synced_at,
        )

    def delete_task(self, task_id: str) -> bool:
        return self.repo.delete(task_id)
