from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from schemas import CreateLinkRequest
from pydantic import ValidationError

links_bp = Blueprint('links', __name__)
storage = LocalStorage()

@links_bp.route('/', methods=['POST'])
def create_link():
    try:
        req = CreateLinkRequest.model_validate(request.json)
        
        note = storage.get_note(req.note_id)
        if not note:
            return jsonify({"error": "Note not found"}), 404
        
        item = storage.get_planner_item(req.planner_item_id)
        if not item:
            return jsonify({"error": "Planner item not found"}), 404
        
        link = storage.create_link(req.note_id, req.planner_item_id)
        return jsonify(link.model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400

@links_bp.route('/<link_id>/', methods=['DELETE'])
def delete_link(link_id):
    success = storage.delete_link(link_id)
    if not success:
        return jsonify({"error": "Link not found"}), 404
    return '', 204
