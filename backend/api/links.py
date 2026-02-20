from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import CreateLinkRequest, LinkResponse, ErrorResponse

links_bp = Blueprint('links', __name__, url_prefix='/api/links')
storage = LocalStorage()


@links_bp.route('/', methods=['POST'])
def create_link():
    try:
        data = CreateLinkRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    note = storage.get_note(data.note_id)
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    
    item = storage.get_planner_item(data.planner_item_id)
    if not item:
        error = ErrorResponse(code='not_found', message='Planner item not found')
        return jsonify(error.model_dump()), 404
    
    link = storage.create_link(data.note_id, data.planner_item_id)
    return jsonify(link.model_dump()), 201


@links_bp.route('/<link_id>/', methods=['DELETE'])
def delete_link(link_id):
    success = storage.delete_link(link_id)
    if not success:
        error = ErrorResponse(code='not_found', message='Link not found')
        return jsonify(error.model_dump()), 404
    return '', 204