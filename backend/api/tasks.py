from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.task_service import TaskService
from services.sync_service import SyncService
from repositories.oauth_token_repo import OAuthTokenRepository
from migrations import migrate_planner_to_tasks
from schemas import (
    ErrorResponse,
    TaskResponse,
    TaskListResponse,
    CreateTaskRequest,
    UpdateTaskRequest,
    SyncPreviewResponse,
    SyncExecuteRequest,
    SyncExecuteResponse,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")
task_service = TaskService()
sync_service = SyncService()
oauth_repo = OAuthTokenRepository()


def handle_validation_error(e: ValidationError) -> tuple:
    errors = "; ".join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@tasks_bp.route("/", methods=["GET"])
def get_tasks():
    tasks = task_service.get_tasks()
    return jsonify(TaskListResponse(tasks=tasks).model_dump()), 200


@tasks_bp.route("/", methods=["POST"])
def create_task():
    try:
        data = CreateTaskRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)

    task = task_service.create_task(
        title=data.title,
        completed=data.completed,
        due_date=data.due_date,
    )
    return jsonify(TaskResponse.model_validate(task).model_dump()), 201


@tasks_bp.route("/<task_id>/", methods=["GET"])
def get_task(task_id: str):
    task = task_service.get_task(task_id)
    if not task:
        return jsonify(ErrorResponse(error="Task not found").model_dump()), 404
    return jsonify(TaskResponse.model_validate(task).model_dump()), 200


@tasks_bp.route("/<task_id>/", methods=["PUT"])
def update_task(task_id: str):
    try:
        data = UpdateTaskRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)

    task = task_service.update_task(
        task_id=task_id,
        title=data.title,
        completed=data.completed,
        due_date=data.due_date,
    )
    if not task:
        return jsonify(ErrorResponse(error="Task not found").model_dump()), 404
    return jsonify(TaskResponse.model_validate(task).model_dump()), 200


@tasks_bp.route("/<task_id>/", methods=["DELETE"])
def delete_task(task_id: str):
    success = task_service.delete_task(task_id)
    if not success:
        return jsonify(ErrorResponse(error="Task not found").model_dump()), 404
    return "", 204


@tasks_bp.route("/sync/status/", methods=["GET"])
def sync_status():
    token = oauth_repo.get()
    connected = token is not None
    return jsonify({"connected": connected}), 200


@tasks_bp.route("/sync/preview/", methods=["GET"])
def preview_sync():
    token = oauth_repo.get()
    if not token:
        return jsonify(ErrorResponse(error="Google account not connected").model_dump()), 401
    
    try:
        preview = sync_service.preview_sync()
        return jsonify(SyncPreviewResponse.model_validate(preview).model_dump()), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Sync preview failed", details=str(e)).model_dump()), 500


@tasks_bp.route("/sync/execute/", methods=["POST"])
def execute_sync():
    token = oauth_repo.get()
    if not token:
        return jsonify(ErrorResponse(error="Google account not connected").model_dump()), 401
    
    try:
        data = SyncExecuteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    try:
        result = sync_service.execute_sync(data.resolutions)
        return jsonify(SyncExecuteResponse.model_validate(result).model_dump()), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Sync execution failed", details=str(e)).model_dump()), 500


@tasks_bp.route("/migrate/", methods=["POST"])
def migrate_planner():
    try:
        result = migrate_planner_to_tasks()
        if "error" in result:
            return jsonify(ErrorResponse(error="Migration failed", details=result["error"]).model_dump()), 500
        return jsonify(result), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Migration failed", details=str(e)).model_dump()), 500
