from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.task_service import TaskService
from schemas import (
    ErrorResponse,
    TaskResponse,
    TaskListResponse,
    CreateTaskRequest,
    UpdateTaskRequest,
)

tasks_bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")
task_service = TaskService()


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
