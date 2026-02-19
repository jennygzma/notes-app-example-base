from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')
storage = LocalStorage()

@notes_bp.route('/', methods=['GET'])
def get_notes():
    notes = storage.get_notes()
    return jsonify(notes), 200

@notes_bp.route('/', methods=['POST'])
def create_note():
    data = request.json
    
    if not data.get('title'):
        return jsonify({"error": "title is required"}), 400
    
    note = storage.create_note(
        title=data['title'],
        body=data.get('body', '')
    )
    return jsonify(note), 201

@notes_bp.route('/<note_id>/', methods=['GET'])
def get_note(note_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(note), 200

@notes_bp.route('/<note_id>/', methods=['PUT'])
def update_note(note_id):
    data = request.json
    note = storage.update_note(
        note_id=note_id,
        title=data.get('title'),
        body=data.get('body')
    )
    
    if not note:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(note), 200

@notes_bp.route('/<note_id>/', methods=['DELETE'])
def delete_note(note_id):
    success = storage.delete_note(note_id)
    if not success:
        return jsonify({"error": "Note not found"}), 404
    return '', 204

@notes_bp.route('/<note_id>/', methods=['PATCH'])
def patch_note(note_id):
    data = request.json
    note = storage.update_note(
        note_id=note_id,
        is_analyzed=data.get('is_analyzed')
    )
    
    if not note:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(note), 200

@notes_bp.route('/<note_id>/links/', methods=['GET'])
def get_note_links(note_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    links = storage.get_links_by_note(note_id)
    planner_items = []
    for link in links:
        item = storage.get_planner_item(link['planner_item_id'])
        if item:
            planner_items.append(item)
    
    return jsonify(planner_items), 200

@notes_bp.route('/<note_id>/folders/', methods=['GET'])
def get_note_folders(note_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    folders = storage.get_folders_for_note(note_id)
    return jsonify(folders), 200

@notes_bp.route('/<note_id>/folders/', methods=['PUT'])
def update_note_folders(note_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    data = request.json
    folder_ids = data.get('folder_ids', [])
    
    current_folders = storage.get_folders_for_note(note_id)
    current_folder_ids = set(f['id'] for f in current_folders)
    new_folder_ids = set(folder_ids)
    
    to_add = new_folder_ids - current_folder_ids
    to_remove = current_folder_ids - new_folder_ids
    
    for folder_id in to_remove:
        storage.remove_note_from_folder(note_id, folder_id)
    
    for folder_id in to_add:
        storage.add_note_to_folder(note_id, folder_id)
    
    updated_folders = storage.get_folders_for_note(note_id)
    return jsonify(updated_folders), 200

@notes_bp.route('/<note_id>/folders/<folder_id>/', methods=['POST'])
def add_note_to_folder(note_id, folder_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    folder = storage.get_folder(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    
    storage.add_note_to_folder(note_id, folder_id)
    return jsonify({"success": True}), 200

@notes_bp.route('/<note_id>/folders/<folder_id>/', methods=['DELETE'])
def remove_note_from_folder(note_id, folder_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    success = storage.remove_note_from_folder(note_id, folder_id)
    if not success:
        return jsonify({"error": "Note not in folder"}), 404
    
    return '', 204
