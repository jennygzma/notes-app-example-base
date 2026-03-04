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
        try:
            dt = datetime.fromisoformat(rfc3339.replace('Z', '+00:00'))
            return dt.isoformat().split('+')[0] + "Z"
        except Exception:
            return datetime.utcnow().isoformat() + "Z"

    def _normalize_google_task(self, google_task: Dict) -> Dict:
        return {
            "id": google_task.get("id"),
            "title": google_task.get("title", "Untitled"),
            "completed": google_task.get("status") == "completed",
            "due_date": google_task.get("due", "").split("T")[0] if google_task.get("due") else None,
            "google_task_id": google_task.get("id"),
            "updated_at": self._normalize_google_timestamp(google_task.get("updated")),
            "last_synced_at": None,
        }

    def preview_sync(self) -> Dict:
        try:
            google_response = self.google.fetch_google_tasks()
            google_tasks_raw = google_response.get("items", [])
        except Exception as e:
            return {
                "actions": [],
                "conflicts": [],
                "summary": {},
                "error": f"Failed to fetch Google tasks: {str(e)}"
            }

        local_tasks = self.task_service.get_tasks()

        google_tasks = [self._normalize_google_task(gt) for gt in google_tasks_raw]

        google_by_id = {gt["google_task_id"]: gt for gt in google_tasks}
        local_by_google_id = {
            lt["google_task_id"]: lt for lt in local_tasks if lt.get("google_task_id")
        }
        local_without_google_id = [lt for lt in local_tasks if not lt.get("google_task_id")]

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
                    local_synced = local.get("updated_at")
                
                local_changed = local.get("updated_at", "") > (local_synced or "")
                google_changed = g_task["updated_at"] > (local_synced or "")

                if local_changed and google_changed:
                    conflicts.append({
                        "task_id": local["id"],
                        "local_task": local,
                        "google_task": g_task,
                        "local_updated_at": local.get("updated_at", ""),
                        "google_updated_at": g_task["updated_at"]
                    })
                elif google_changed:
                    actions.append({
                        "action": "update",
                        "task": {**local, **g_task, "id": local["id"]},
                        "source": "google",
                        "reason": "Updated on Google"
                    })

        for local in local_without_google_id:
            actions.append({
                "action": "create",
                "task": local,
                "source": "local",
                "reason": "New local task"
            })

        for local in local_by_google_id.values():
            g_id = local.get("google_task_id")
            local_synced = local.get("last_synced_at") or local.get("updated_at")
            local_changed = local.get("updated_at", "") > (local_synced or "")

            if g_id not in google_by_id:
                actions.append({
                    "action": "delete",
                    "task": local,
                    "source": "local",
                    "reason": "Deleted on Google"
                })
            elif local_changed and g_id in google_by_id:
                g_task = google_by_id[g_id]
                google_changed = g_task["updated_at"] > (local_synced or "")
                if not google_changed:
                    actions.append({
                        "action": "update",
                        "task": local,
                        "source": "local",
                        "reason": "Updated locally"
                    })

        summary = {
            "create_local": sum(1 for a in actions if a["action"] == "create" and a["source"] == "google"),
            "create_google": sum(1 for a in actions if a["action"] == "create" and a["source"] == "local"),
            "update_local": sum(1 for a in actions if a["action"] == "update" and a["source"] == "google"),
            "update_google": sum(1 for a in actions if a["action"] == "update" and a["source"] == "local"),
            "delete_local": sum(1 for a in actions if a["action"] == "delete" and a["source"] == "local"),
            "conflicts": len(conflicts)
        }

        return {
            "actions": actions,
            "conflicts": conflicts,
            "summary": summary
        }

    def execute_sync(self, resolutions: List[Dict]) -> Dict:
        preview = self.preview_sync()
        actions = preview["actions"]
        conflicts = preview["conflicts"]

        def _resolution_value(resolution) -> str:
            if hasattr(resolution, "resolution"):
                return resolution.resolution
            if isinstance(resolution, dict):
                return resolution.get("resolution", "skip")
            return "skip"

        def _resolution_task_id(resolution) -> Optional[str]:
            if hasattr(resolution, "task_id"):
                return resolution.task_id
            if isinstance(resolution, dict):
                return resolution.get("task_id")
            return None

        resolution_map = {}
        for r in resolutions:
            task_id = _resolution_task_id(r)
            if task_id:
                resolution_map[task_id] = _resolution_value(r)

        created = 0
        updated = 0
        deleted = 0
        skipped = 0
        errors = []

        now = datetime.utcnow().isoformat() + "Z"

        for conflict in conflicts:
            task_id = conflict["task_id"]
            resolution = resolution_map.get(task_id, "skip")
            
            if resolution == "skip":
                skipped += 1
                continue
            
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
                        due_date=google_task["due_date"],
                        last_synced_at=now
                    )
                    updated += 1
            except Exception as e:
                errors.append(f"Conflict resolution failed for {task_id}: {str(e)}")

        for action in actions:
            try:
                if action["action"] == "create" and action["source"] == "google":
                    g_task = action["task"]
                    local_task = self.task_service.create_task(
                        title=g_task["title"],
                        completed=g_task["completed"],
                        due_date=g_task["due_date"]
                    )
                    self.task_service.update_task(
                        task_id=local_task["id"],
                        google_task_id=g_task["google_task_id"],
                        last_synced_at=now
                    )
                    created += 1

                elif action["action"] == "create" and action["source"] == "local":
                    local_task = action["task"]
                    google_task = self.google.create_google_task({
                        "title": local_task["title"],
                        "due_date": local_task.get("due_date")
                    })
                    self.task_service.update_task(
                        task_id=local_task["id"],
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
                        due_date=task_data["due_date"],
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

                elif action["action"] == "delete" and action["source"] == "local":
                    task_data = action["task"]
                    self.task_service.delete_task(task_data["id"])
                    deleted += 1

            except Exception as e:
                errors.append(f"Action failed ({action['action']} {action['source']}): {str(e)}")

        return {
            "created": created,
            "updated": updated,
            "deleted": deleted,
            "skipped": skipped,
            "errors": errors
        }
