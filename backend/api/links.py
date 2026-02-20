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


@links_bp.route('/', methods=['POST'])
def create_link():
    try:
        data = CreateLinkRequest.model_validate(request.json)
        
        note = storage.get_note(data.note_id)
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        
        item = storage.get_planner_item(data.planner_item_id)
        if not item:
            error = ErrorResponse(error="Planner item not found")
            return jsonify(error.model_dump()), 404
        
        link = storage.create_link(data.note_id, data.planner_item_id)
        return jsonify(link.model_dump()), 201
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to create link", details=str(e))
        return jsonify(error.model_dump()), 500


@links_bp.route('/<link_id>/', methods=['DELETE'])
def delete_link(link_id):
    try:
        success = storage.delete_link(link_id)
        if not success:
            error = ErrorResponse(error="Link not found")
            return jsonify(error.model_dump()), 404
        return '', 204
    except Exception as e:
        error = ErrorResponse(error="Failed to delete link", details=str(e))
        return jsonify(error.model_dump()), 500