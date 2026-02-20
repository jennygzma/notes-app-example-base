from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import (
    CreatePlannerItemRequest,
    UpdatePlannerItemRequest,
    PlannerItemResponse,
    ErrorResponse
)

planner_bp = Blueprint('planner', __name__, url_prefix='/api/planner')
storage = LocalStorage()


def handle_validation_error(e: ValidationError) -> tuple:
    """Helper to format Pydantic validation errors"""
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@planner_bp.route('/items/', methods=['GET'])
def get_planner_items():
    """Get planner items with optional filters"""
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
    return jsonify(items), 200


@planner_bp.route('/items/', methods=['POST'])
def create_planner_item():
    """Create a new planner item"""
    try:
        data = CreatePlannerItemRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    item = storage.create_planner_item(
        title=data.title,
        body=data.body,
        date=data.date,
        time=data.time,
        view_type=data.view_type
    )
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 201


@planner_bp.route('/items/<item_id>/', methods=['GET'])
def get_planner_item(item_id: str):
    """Get a specific planner item"""
    item = storage.get_planner_item(item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 200


@planner_bp.route('/items/<item_id>/', methods=['PUT'])
def update_planner_item(item_id: str):
    """Update a planner item"""
    try:
        data = UpdatePlannerItemRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    # Convert to dict and filter out None values
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    item = storage.update_planner_item(item_id, **update_data)
    
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 200


@planner_bp.route('/items/<item_id>/', methods=['DELETE'])
def delete_planner_item(item_id: str):
    """Delete a planner item"""
    success = storage.delete_planner_item(item_id)
    if not success:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return '', 204


@planner_bp.route('/items/<item_id>/complete/', methods=['PATCH'])
def toggle_completion(item_id: str):
    """Toggle planner item completion status"""
    item = storage.toggle_planner_item_status(item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 200


@planner_bp.route('/items/<item_id>/links/', methods=['GET'])
def get_planner_item_links(item_id: str):
    """Get notes linked to this planner item"""
    item = storage.get_planner_item(item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    
    links = storage.get_links_by_planner_item(item_id)
    notes = []
    for link in links:
        note = storage.get_note(link['note_id'])
        if note:
            notes.append(note)
    
    return jsonify(notes), 200