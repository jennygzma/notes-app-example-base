from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import (
    CreateLinkRequest,
    LinkResponse,
    ErrorResponse
)

links_bp = Blueprint('links', __name__, url_prefix='/api/links')
storage = LocalStorage()


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
    note = storage.get_note(data.note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    # Validate planner item exists
    item = storage.get_planner_item(data.planner_item_id)
    if not item:
        return jsonify(ErrorResponse(error="Planner item not found").model_dump()), 404
    
    link = storage.create_link(data.note_id, data.planner_item_id)
    return jsonify(LinkResponse.model_validate(link).model_dump()), 201


@links_bp.route('/<link_id>/', methods=['DELETE'])
def delete_link(link_id: str):
    """Delete a link"""
    success = storage.delete_link(link_id)
    if not success:
        return jsonify(ErrorResponse(error="Link not found").model_dump()), 404
    return '', 204