from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.link_service import LinkService
from services.note_service import NoteService
from services.planner_service import PlannerService
from schemas import (
    CreateLinkRequest,
    LinkResponse,
    ErrorResponse
)

links_bp = Blueprint('links', __name__, url_prefix='/api/links')
link_service = LinkService()
note_service = NoteService()
planner_service = PlannerService()


def handle_validation_error(e: ValidationError) -> tuple:
    """Helper to format Pydantic validation errors"""
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@links_bp.route('/', methods=['POST'])
def create_link():
    """Create a link between a note and planner item"""
    try:
        data = CreateLinkRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    # Validate note exists
    note = note_service.get_note(data.note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    # Validate planner item exists
    item = planner_service.get_item(data.planner_item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    
    link = link_service.create_link(data.note_id, data.planner_item_id)
    return jsonify(LinkResponse.model_validate(link).model_dump()), 201


@links_bp.route('/<link_id>/', methods=['DELETE'])
def delete_link(link_id: str):
    """Delete a link"""
    success = link_service.delete_link(link_id)
    if not success:
        return jsonify(ErrorResponse(error="Link not found").model_dump()), 404
    return '', 204
