from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.planner_service import PlannerService
from services.link_service import LinkService
from services.note_service import NoteService
from schemas import (
    CreatePlannerItemRequest,
    UpdatePlannerItemRequest,
    PlannerItemResponse,
    PlannerItemListResponse,
    NoteListResponse,
    ErrorResponse
)

planner_bp = Blueprint('planner', __name__, url_prefix='/api/planner')
planner_service = PlannerService()
link_service = LinkService()
note_service = NoteService()


def handle_validation_error(e: ValidationError) -> tuple:
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@planner_bp.route('/items/', methods=['GET'])
def get_planner_items():
    date_start = request.args.get('date_start')
    date_end = request.args.get('date_end')
    view_type = request.args.get('view_type')
    status = request.args.get('status')
    
    items = planner_service.get_items(
        date_start=date_start,
        date_end=date_end,
        view_type=view_type,
        status=status
    )
    return jsonify(PlannerItemListResponse(items=items).model_dump()), 200


@planner_bp.route('/items/', methods=['POST'])
def create_planner_item():
    try:
        data = CreatePlannerItemRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    item = planner_service.create_item(
        title=data.title,
        body=data.body,
        date=data.date,
        time=data.time,
        view_type=data.view_type
    )
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 201


@planner_bp.route('/items/<item_id>/', methods=['GET'])
def get_planner_item(item_id: str):
    item = planner_service.get_item(item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 200


@planner_bp.route('/items/<item_id>/', methods=['PUT'])
def update_planner_item(item_id: str):
    try:
        data = UpdatePlannerItemRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    # Convert to dict and filter out None values
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    item = planner_service.update_item(item_id, **update_data)
    
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 200


@planner_bp.route('/items/<item_id>/', methods=['DELETE'])
def delete_planner_item(item_id: str):
    success = planner_service.delete_item(item_id)
    if not success:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return '', 204


@planner_bp.route('/items/<item_id>/complete/', methods=['PATCH'])
def toggle_completion(item_id: str):
    item = planner_service.toggle_status(item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    return jsonify(PlannerItemResponse.model_validate(item).model_dump()), 200


@planner_bp.route('/items/<item_id>/links/', methods=['GET'])
def get_planner_item_links(item_id: str):
    item = planner_service.get_item(item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    
    links = link_service.get_links_by_planner_item(item_id)
    notes = []
    for link in links:
        note = note_service.get_note(link['note_id'])
        if note:
            notes.append(note)
    
    return jsonify(NoteListResponse(notes=notes).model_dump()), 200
