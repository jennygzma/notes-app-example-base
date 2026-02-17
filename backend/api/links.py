from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

links_bp = Blueprint('links', __name__, url_prefix='/api/links')
storage = LocalStorage()

@links_bp.route('/', methods=['POST'])
def create_link():
    data = request.json
    
    note_id = data.get('note_id')
    planner_item_id = data.get('planner_item_id')
    
    if not note_id or not planner_item_id:
        return jsonify({"error": "note_id and planner_item_id are required"}), 400
    
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    item = storage.get_planner_item(planner_item_id)
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    
    link = storage.create_link(note_id, planner_item_id)
    return jsonify(link), 201

@links_bp.route('/<link_id>/', methods=['DELETE'])
def delete_link(link_id):
    success = storage.delete_link(link_id)
    if not success:
        return jsonify({"error": "Link not found"}), 404
    return '', 204
