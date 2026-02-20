from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
storage = LocalStorage()
gpt_client = GPTClient()

@folders_bp.route('/', methods=['GET'])
def get_folders():
    folders = storage.get_folders()
    
    for folder in folders:
        note_ids = storage.get_notes_for_folder(folder['id'])
        folder['note_count'] = len(note_ids)
    
    return jsonify(folders), 200

@folders_bp.route('/', methods=['POST'])
def create_folder():
    data = request.json
    
    if not data.get('name'):
        return jsonify({"error": "name is required"}), 400
    
    folder = storage.create_folder(
        name=data['name'],
        color=data.get('color')
    )
    folder['note_count'] = 0
    
    return jsonify(folder), 201

@folders_bp.route('/<folder_id>/', methods=['DELETE'])
def delete_folder(folder_id):
    folder = storage.get_folder(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    
    success = storage.delete_folder(folder_id)
    if not success:
        return jsonify({"error": "Failed to delete folder"}), 500
    
    return '', 204

@folders_bp.route('/organize/preview/', methods=['POST'])
def organize_preview():
    unorganized_notes = storage.get_unorganized_notes()
    
    if not unorganized_notes:
        return jsonify({
            "suggested_folders": [],
            "note_assignments": []
        }), 200
    
    existing_folders = storage.get_folders()
    
    result = gpt_client.organize_notes(unorganized_notes, existing_folders)
    
    return jsonify(result), 200

@folders_bp.route('/organize/apply/', methods=['POST'])
def organize_apply():
    data = request.json
    
    if not data or 'suggested_folders' not in data or 'note_assignments' not in data:
        return jsonify({"error": "Invalid request format"}), 400
    
    suggested_folders = data['suggested_folders']
    note_assignments = data['note_assignments']
    
    folder_name_to_id = {}
    for folder in storage.get_folders():
        folder_name_to_id[folder['name']] = folder['id']
    
    for folder_data in suggested_folders:
        folder_name = folder_data['name']
        if folder_name not in folder_name_to_id:
            new_folder = storage.create_folder(
                name=folder_name,
                color=folder_data.get('color')
            )
            folder_name_to_id[folder_name] = new_folder['id']
    
    for assignment in note_assignments:
        note_id = assignment['note_id']
        folder_names = assignment.get('folder_names', [])
        
        folder_ids = []
        for folder_name in folder_names:
            if folder_name in folder_name_to_id:
                folder_ids.append(folder_name_to_id[folder_name])
        
        if folder_ids:
            storage.update_note_folders(note_id, folder_ids)
    
    return jsonify({"success": True}), 200