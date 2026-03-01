from typing import Dict, List, Optional
from datetime import datetime, timezone
from integrations.google.tasks import GoogleTasksService
from services.task_service import TaskService


class SyncService:
    def __init__(self):
        self.google = GoogleTasksService()
        self.task_service = TaskService()

    def _normalize_google_timestamp(self, rfc3339: Optional[str]) -> Optional[str]:
        if not rfc3339:
            return None
        try:
            dt = datetime.fromisoformat(rfc3339.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%dT%H:%M:%S') + 'Z'
        except Exception:
            return None

    def _normalize_google_task(self, google_task: Dict) -> Dict:
        due_date = None
        if google_task.get('due'):
            due_str = google_task['due']
            if 'T' in due_str:
                due_date = due_str.split('T')[0]
            else:
                due_date = due_str

        return {
            'google_task_id': google_task['id'],
            'title': google_task.get('title', ''),
            'completed': google_task.get('status') == 'completed',
            'due_date': due_date,
            'updated_at': self._normalize_google_timestamp(google_task.get('updated')),
        }

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')

    def preview_sync(self) -> Dict:
        google_tasks_raw = self.google.fetch_google_tasks()
        google_tasks = [self._normalize_google_task(t) for t in google_tasks_raw.get('items', [])]
        local_tasks = self.task_service.get_tasks()

        google_by_id = {t['google_task_id']: t for t in google_tasks}
        local_by_google_id = {t['google_task_id']: t for t in local_tasks if t.get('google_task_id')}
        local_without_google_id = [t for t in local_tasks if not t.get('google_task_id')]

        actions = []
        conflicts = []

        for g_task in google_tasks:
            g_id = g_task['google_task_id']
            if g_id not in local_by_google_id:
                actions.append({
                    'action': 'create',
                    'task': g_task,
                    'source': 'google',
                    'reason': 'New task from Google'
                })
            else:
                local = local_by_google_id[g_id]
                local_changed = local.get('last_synced_at') and local['updated_at'] > local['last_synced_at']
                google_changed = local.get('last_synced_at') and g_task['updated_at'] and g_task['updated_at'] > local['last_synced_at']
                
                if local_changed and google_changed:
                    conflicts.append({
                        'task_id': local['id'],
                        'local_task': local,
                        'google_task': g_task,
                        'local_updated_at': local['updated_at'],
                        'google_updated_at': g_task['updated_at']
                    })
                elif google_changed:
                    actions.append({
                        'action': 'update',
                        'task': {**g_task, 'id': local['id']},
                        'source': 'google',
                        'reason': 'Updated in Google'
                    })

        for local in local_without_google_id:
            actions.append({
                'action': 'create',
                'task': local,
                'source': 'local',
                'reason': 'New local task to sync to Google'
            })

        for local in local_by_google_id.values():
            g_id = local['google_task_id']
            local_changed = local.get('last_synced_at') and local['updated_at'] > local['last_synced_at']
            
            if g_id not in google_by_id:
                actions.append({
                    'action': 'delete',
                    'task': local,
                    'source': 'local',
                    'reason': 'Deleted in Google'
                })
            elif local_changed and g_id in google_by_id:
                g_task = google_by_id[g_id]
                google_changed = local.get('last_synced_at') and g_task['updated_at'] and g_task['updated_at'] > local['last_synced_at']
                if not google_changed:
                    actions.append({
                        'action': 'update',
                        'task': local,
                        'source': 'local',
                        'reason': 'Updated locally'
                    })

        summary = {
            'create_local': sum(1 for a in actions if a['action'] == 'create' and a['source'] == 'google'),
            'update_local': sum(1 for a in actions if a['action'] == 'update' and a['source'] == 'google'),
            'delete_local': sum(1 for a in actions if a['action'] == 'delete' and a['source'] == 'local'),
            'create_google': sum(1 for a in actions if a['action'] == 'create' and a['source'] == 'local'),
            'update_google': sum(1 for a in actions if a['action'] == 'update' and a['source'] == 'local'),
            'conflicts': len(conflicts)
        }

        return {
            'actions': actions,
            'conflicts': conflicts,
            'summary': summary
        }

    def execute_sync(self, resolutions: List[Dict]) -> Dict:
        resolution_map = {r['task_id']: r['resolution'] for r in resolutions}
        preview = self.preview_sync()
        
        created = 0
        updated = 0
        deleted = 0
        skipped = 0
        errors = []
        now = self._now()

        for action in preview['actions']:
            try:
                if action['action'] == 'create' and action['source'] == 'google':
                    task_data = action['task']
                    task = self.task_service.create_task(
                        title=task_data['title'],
                        completed=task_data['completed'],
                        due_date=task_data.get('due_date')
                    )
                    self.task_service.update_task(
                        task['id'],
                        google_task_id=task_data['google_task_id'],
                        last_synced_at=now
                    )
                    created += 1

                elif action['action'] == 'create' and action['source'] == 'local':
                    task_data = action['task']
                    google_task = self.google.create_google_task({
                        'title': task_data['title'],
                        'due_date': task_data.get('due_date')
                    })
                    self.task_service.update_task(
                        task_data['id'],
                        google_task_id=google_task['id'],
                        last_synced_at=now
                    )
                    created += 1

                elif action['action'] == 'update' and action['source'] == 'google':
                    task_data = action['task']
                    self.task_service.update_task(
                        task_data['id'],
                        title=task_data['title'],
                        completed=task_data['completed'],
                        due_date=task_data.get('due_date'),
                        last_synced_at=now
                    )
                    updated += 1

                elif action['action'] == 'update' and action['source'] == 'local':
                    task_data = action['task']
                    self.google.update_google_task({
                        'google_task_id': task_data['google_task_id'],
                        'title': task_data['title'],
                        'completed': task_data['completed'],
                        'due_date': task_data.get('due_date')
                    })
                    self.task_service.update_task(
                        task_data['id'],
                        last_synced_at=now
                    )
                    updated += 1

                elif action['action'] == 'delete' and action['source'] == 'local':
                    task_data = action['task']
                    self.task_service.delete_task(task_data['id'])
                    deleted += 1

            except Exception as e:
                errors.append(f"Failed to {action['action']} task: {str(e)}")
                skipped += 1

        for conflict in preview['conflicts']:
            task_id = conflict['task_id']
            resolution = resolution_map.get(task_id, 'skip')
            
            try:
                if resolution == 'use_google':
                    g_task = conflict['google_task']
                    self.task_service.update_task(
                        task_id,
                        title=g_task['title'],
                        completed=g_task['completed'],
                        due_date=g_task.get('due_date'),
                        last_synced_at=now
                    )
                    updated += 1
                elif resolution == 'use_local':
                    local = conflict['local_task']
                    self.google.update_google_task({
                        'google_task_id': local['google_task_id'],
                        'title': local['title'],
                        'completed': local['completed'],
                        'due_date': local.get('due_date')
                    })
                    self.task_service.update_task(
                        task_id,
                        last_synced_at=now
                    )
                    updated += 1
                else:
                    skipped += 1
            except Exception as e:
                errors.append(f"Failed to resolve conflict for task {task_id}: {str(e)}")
                skipped += 1

        return {
            'created': created,
            'updated': updated,
            'deleted': deleted,
            'skipped': skipped,
            'errors': errors
        }