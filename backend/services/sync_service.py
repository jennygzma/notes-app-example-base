from typing import Dict, List, Optional
from datetime import datetime
from integrations.google.tasks import GoogleTasksService
from services.task_service import TaskService


class SyncService:
    def __init__(self):
        self.google = GoogleTasksService()
        self.task_service = TaskService()

    def _normalize_google_timestamp(self, rfc3339: str) -> str:
        if not rfc3339:
            return datetime.utcnow().isoformat() + "Z"
        dt = datetime.fromisoformat(rfc3339.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%dT%H:%M:%S") + "Z"

    def _normalize_google_task(self, google_task: Dict) -> Dict:
        return {
            "id": google_task.get("id"),
            "title": google_task.get("title", ""),
            "completed": google_task.get("status") == "completed",
            "due_date": google_task.get("due"),
            "google_task_id": google_task.get("id"),
            "updated_at": self._normalize_google_timestamp(google_task.get("updated")),
            "last_synced_at": None,
        }

    def preview_sync(self) -> Dict:
        google_response = self.google.fetch_google_tasks()
        google_tasks_raw = google_response.get("items", [])
        google_tasks = [self._normalize_google_task(gt) for gt in google_tasks_raw]
        
        local_tasks = self.task_service.get_tasks()
        
        google_by_id = {t["google_task_id"]: t for t in google_tasks}
        local_by_google_id = {t["google_task_id"]: t for t in local_tasks if t.get("google_task_id")}
        local_without_google_id = [t for t in local_tasks if not t.get("google_task_id")]
        
        actions = []
        conflicts = []
        
        for g_task in google_tasks:
            g_id = g_task["google_task_id"]
            if g_id not in local_by_google_id:
                actions.append({
                    "action": "create",
                    "task": g_task,
                    "source": "google",
                    "reason": "New task from Google"
                })
            else:
                local = local_by_google_id[g_id]
                local_synced = local.get("last_synced_at")
                
                if not local_synced:
                    conflicts.append({
                        "task_id": local["id"],
                        "local_task": local,
                        "google_task": g_task,
                        "local_updated_at": local["updated_at"],
                        "google_updated_at": g_task["updated_at"]
                    })
                elif g_task["updated_at"] > local_synced and local["updated_at"] > local_synced:
                    conflicts.append({
                        "task_id": local["id"],
                        "local_task": local,
                        "google_task": g_task,
                        "local_updated_at": local["updated_at"],
                        "google_updated_at": g_task["updated_at"]
                    })
                elif g_task["updated_at"] > local_synced:
                    actions.append({
                        "action": "update",
                        "task": {**g_task, "id": local["id"]},
                        "source": "google",
                        "reason": "Updated on Google"
                    })
                elif local["updated_at"] > local_synced:
                    actions.append({
                        "action": "update",
                        "task": local,
                        "source": "local",
                        "reason": "Updated locally"
                    })
        
        for local in local_without_google_id:
            actions.append({
                "action": "create",
                "task": local,
                "source": "local",
                "reason": "New task created locally"
            })
        
        for local in local_by_google_id.values():
            g_id = local.get("google_task_id")
            if g_id not in google_by_id:
                actions.append({
                    "action": "delete",
                    "task": local,
                    "source": "local",
                    "reason": "Deleted on Google"
                })
        
        summary = {}
        for action in actions:
            key = f"{action['action']}_{action['source']}"
            summary[key] = summary.get(key, 0) + 1
        summary["conflicts"] = len(conflicts)
        
        return {
            "actions": actions,
            "conflicts": conflicts,
            "summary": summary
        }

    def execute_sync(self, resolutions: List[Dict]) -> Dict:
        preview = self.preview_sync()
        actions = preview["actions"]
        conflicts = preview["conflicts"]
        
        resolution_map = {r["task_id"]: r["resolution"] for r in resolutions}
        
        created = 0
        updated = 0
        deleted = 0
        skipped = 0
        errors = []
        now = datetime.utcnow().isoformat() + "Z"
        
        for action in actions:
            try:
                if action["action"] == "create" and action["source"] == "google":
                    task_data = action["task"]
                    new_task = self.task_service.create_task(
                        title=task_data["title"],
                        completed=task_data["completed"],
                        due_date=task_data.get("due_date")
                    )
                    self.task_service.update_task(
                        task_id=new_task["id"],
                        google_task_id=task_data["google_task_id"],
                        last_synced_at=now
                    )
                    created += 1
                elif action["action"] == "create" and action["source"] == "local":
                    task_data = action["task"]
                    if task_data.get("google_task_id"):
                        errors.append(f"Task {task_data['id']} already has google_task_id, cannot re-create")
                        skipped += 1
                        continue
                    google_task = self.google.create_google_task(task_data)
                    self.task_service.update_task(
                        task_id=task_data["id"],
                        google_task_id=google_task["id"],
                        last_synced_at=now
                    )
                    created += 1
                elif action["action"] == "update" and action["source"] == "google":
                    task_data = action["task"]
                    self.task_service.update_task(
                        task_id=task_data["id"],
                        title=task_data["title"],
                        completed=task_data["completed"],
                        due_date=task_data.get("due_date"),
                        last_synced_at=now
                    )
                    updated += 1
                elif action["action"] == "update" and action["source"] == "local":
                    task_data = action["task"]
                    self.google.update_google_task(task_data)
                    self.task_service.update_task(
                        task_id=task_data["id"],
                        last_synced_at=now
                    )
                    updated += 1
                elif action["action"] == "delete":
                    task_data = action["task"]
                    self.task_service.delete_task(task_data["id"])
                    deleted += 1
            except Exception as e:
                errors.append(f"Failed to {action['action']} task: {str(e)}")
        
        for conflict in conflicts:
            task_id = conflict["task_id"]
            resolution = resolution_map.get(task_id, "skip")
            
            try:
                if resolution == "use_local":
                    local_task = conflict["local_task"]
                    self.google.update_google_task(local_task)
                    self.task_service.update_task(
                        task_id=task_id,
                        last_synced_at=now
                    )
                    updated += 1
                elif resolution == "use_google":
                    google_task = conflict["google_task"]
                    self.task_service.update_task(
                        task_id=task_id,
                        title=google_task["title"],
                        completed=google_task["completed"],
                        due_date=google_task.get("due_date"),
                        last_synced_at=now
                    )
                    updated += 1
                elif resolution == "skip":
                    skipped += 1
            except Exception as e:
                errors.append(f"Failed to resolve conflict for task {task_id}: {str(e)}")
        
        return {
            "created": created,
            "updated": updated,
            "deleted": deleted,
            "skipped": skipped,
            "errors": errors
        }

    def sync_google_tasks(self) -> Dict:
        return {"status": "not_implemented"}
