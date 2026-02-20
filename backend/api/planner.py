from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import (
    CreatePlannerItemRequest, UpdatePlannerItemRequest,
    PlannerItemResponse, NoteResponse, ErrorResponse
)

planner_bp = Blueprint('planner', __name__, url_prefix='/api/planner')
storage = LocalStorage()


@planner_bp.route('/items/', methods=['GET'])
def get_planner_items():
    date_start = request.args.get('date_start')
    date_end = request.args.get('date_end')
    view_type = request.args.get('view_type')
    status = request.args.get('status')
    
    items = storage.get_planner_items(
        date_start=date_start,
        date_end=date_end,
        view_type=view_type,
        status=status
    )
    return jsonify([i.model_dump() for i in items]), 200


@planner_bp.route('/items/', methods=['POST'])
def create_planner_item():
    try:
        data = CreatePlannerItemRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    item = storage.create_planner_item(
        title=data.title,
        body=data.body,
        date=data.date,
        time=data.time,
        view_type=data.view_type
    )
    return jsonify(item.model_dump()), 201


@planner_bp.route('/items/<item_id>/', methods=['GET'])
def get_planner_item(item_id):
    item = storage.get_planner_item(item_id)
    if not item:
        error = ErrorResponse(code='not_found', message='Planner item not found')
        return jsonify(error.model_dump()), 404
    return jsonify(item.model_dump()), 200


@planner_bp.route('/items/<item_id>/', methods=['PUT'])
def update_planner_item(item_id):
    try:
        data = UpdatePlannerItemRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    update_data = data.model_dump(exclude_unset=True)
    item = storage.update_planner_item(item_id, **update_data)
    
    if not item:
        error = ErrorResponse(code='not_found', message='Planner item not found')
        return jsonify(error.model_dump()), 404
    return jsonify(item.model_dump()), 200


@planner_bp.route('/items/<item_id>/', methods=['DELETE'])
def delete_planner_item(item_id):
    success = storage.delete_planner_item(item_id)
    if not success:
        error = ErrorResponse(code='not_found', message='Planner item not found')
        return jsonify(error.model_dump()), 404
    return '', 204


@planner_bp.route('/items/<item_id>/complete/', methods=['PATCH'])
def toggle_completion(item_id):
    item = storage.toggle_planner_item_status(item_id)
    if not item:
        error = ErrorResponse(code='not_found', message='Planner item not found')
        return jsonify(error.model_dump()), 404
    return jsonify(item.model_dump()), 200


@planner_bp.route('/items/<item_id>/links/', methods=['GET'])
def get_planner_item_links(item_id):
    item = storage.get_planner_item(item_id)
    if not item:
        error = ErrorResponse(code='not_found', message='Planner item not found')
        return jsonify(error.model_dump()), 404
    
    links = storage.get_links_by_planner_item(item_id)
    notes = []
    for link in links:
        note = storage.get_note(link.note_id)
        if note:
            notes.append(note.model_dump())
    
    return jsonify(notes), 200