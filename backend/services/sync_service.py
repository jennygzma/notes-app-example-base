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
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

    def _normalize_google_task(self, google_task: Dict) -> Dict:
        status = google_task.get("status", "needsAction")
        completed = status == "completed"
        
        due_date = None
        if google_task.get("due"):
            due_str = google_task["due"]
            if "T" in due_str:
                due_date = due_str.split("T")[0]
            else:
                due_date = due_str
        
        updated_at = self._normalize_google_timestamp(google_task.get("updated", ""))
        
        return {
            "id": google_task.get("id"),
            "title": google_task.get("title", "Untitled"),
            "completed": completed,
            "due_date": due_date,
            "google_task_id": google_task.get("id"),
            "updated_at": updated_at,
        }

    def preview_sync(self) -> Dict:
        google_response = self.google.fetch_google_tasks()
        google_tasks_raw = google_response.get("items", [])
        local_tasks = self.task_service.get_tasks()
        
        google_by_id = {}
        for g_task in google_tasks_raw:
            normalized = self._normalize_google_task(g_task)
            normalized["_raw_google_id"] = g_task.get("id")
            google_by_id[g_task.get("id")] = normalized
        
        local_by_google_id = {}
        local_without_google_id = []
        for local in local_tasks:
            if local.get("google_task_id"):
                local_by_google_id[local["google_task_id"]] = local
            else:
                local_without_google_id.append(local)
        
        actions = []
        conflicts = []
        
        for g_id, g_task in google_by_id.items():
            if g_id not in local_by_google_id:
                actions.append({
                    "action": "create",
                    "task": g_task,
                    "source": "google",
                    "reason": "New task from Google"
                })
            else:
                local = local_by_google_id[g_id]
                last_synced = local.get("last_synced_at")
                
                if not last_synced:
                    conflicts.append({
                        "task_id": local["id"],
                        "local_task": local,
                        "google_task": g_task,
                        "local_updated_at": local["updated_at"],
                        "google_updated_at": g_task["updated_at"]
                    })
                elif local["updated_at"] > last_synced and g_task["updated_at"] > last_synced:
                    conflicts.append({
                        "task_id": local["id"],
                        "local_task": local,
                        "google_task": g_task,
                        "local_updated_at": local["updated_at"],
                        "google_updated_at": g_task["updated_at"]
                    })
                elif g_task["updated_at"] > last_synced:
                    actions.append({
                        "action": "update",
                        "task": {
                            **local,
                            **g_task,
                            "id": local["id"],
                            "google_task_id": local.get("google_task_id") or g_task.get("google_task_id"),
                        },
                        "source": "google",
                        "reason": "Updated on Google"
                    })
                elif local["updated_at"] > last_synced:
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
                "reason": "New local task"
            })
        
        for g_id, local in local_by_google_id.items():
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
                    created_task = self.task_service.create_task(
                        title=task_data["title"],
                        completed=task_data["completed"],
                        due_date=task_data.get("due_date")
                    )
                    self.task_service.update_task(
                        task_id=created_task["id"],
                        google_task_id=task_data["google_task_id"],
                        last_synced_at=now
                    )
                    created += 1
                elif action["action"] == "create" and action["source"] == "local":
                    local_task = action["task"]
                    if local_task.get("google_task_id"):
                        skipped += 1
                        continue
                    
                    g_task = self.google.create_google_task({
                        "title": local_task["title"],
                        "due_date": local_task.get("due_date")
                    })
                    self.task_service.update_task(
                        task_id=local_task["id"],
                        google_task_id=g_task["id"],
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
                    local_task = action["task"]
                    self.google.update_google_task(local_task)
                    self.task_service.update_task(
                        task_id=local_task["id"],
                        last_synced_at=now
                    )
                    updated += 1
                elif action["action"] == "delete":
                    local_task = action["task"]
                    self.task_service.delete_task(local_task["id"])
                    deleted += 1
            except Exception as e:
                errors.append(f"Failed to {action['action']} task: {str(e)}")
        
        for conflict in conflicts:
            task_id = conflict["task_id"]
            resolution = resolution_map.get(task_id)
            
            if not resolution or resolution == "skip":
                skipped += 1
                continue
            
            try:
                if resolution == "use_local":
                    local = conflict["local_task"]
                    if local.get("google_task_id"):
                        self.google.update_google_task(local)
                    self.task_service.update_task(
                        task_id=local["id"],
                        last_synced_at=now
                    )
                    updated += 1
                elif resolution == "use_google":
                    google = conflict["google_task"]
                    if google:
                        self.task_service.update_task(
                            task_id=task_id,
                            title=google["title"],
                            completed=google["completed"],
                            due_date=google.get("due_date"),
                            last_synced_at=now
                        )
                        updated += 1
                    else:
                        self.task_service.delete_task(task_id)
                        deleted += 1
            except Exception as e:
                errors.append(f"Failed to resolve conflict for task {task_id}: {str(e)}")
        
        return {
            "created": created,
            "updated": updated,
            "deleted": deleted,
            "skipped": skipped,
            "errors": errors
        }
