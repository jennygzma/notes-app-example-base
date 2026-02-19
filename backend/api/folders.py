from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
storage = LocalStorage()

@folders_bp.route('/', methods=['GET'])
def get_folders():
    folders = storage.get_folders()
    for folder in folders:
        note_ids = storage.get_folder_note_ids(folder["id"])
        folder["note_count"] = len(note_ids)
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
    folder["note_count"] = 0
    return jsonify(folder), 201

@folders_bp.route('/<folder_id>/', methods=['DELETE'])
def delete_folder(folder_id):
    success = storage.delete_folder(folder_id)
    if not success:
        return jsonify({"error": "Folder not found"}), 404
    return '', 204

@folders_bp.route('/organize/', methods=['POST'])
def organize_folders():
    from models.gpt_client import GPTClient
    
    data = request.json
    dry_run = data.get('dry_run', True)
    
    if dry_run:
        all_notes = storage.get_notes()
        unorganized_notes = [note for note in all_notes if not note.get('folder_ids') or len(note.get('folder_ids', [])) == 0]
        
        if not unorganized_notes:
            return jsonify({
                "suggested_folders": [],
                "note_assignments": []
            }), 200
        
        existing_folders = storage.get_folders()
        
        gpt_client = GPTClient()
        result = gpt_client.organize_notes(unorganized_notes, existing_folders)
        
        return jsonify(result), 200
    else:
        return jsonify({
            "folders_created": 0,
            "notes_assigned": 0
        }), 200

@folders_bp.route('/organize/apply/', methods=['POST'])
def apply_organization():
    data = request.json
    suggested_folders = data.get('suggested_folders', [])
    note_assignments = data.get('note_assignments', [])
    
    folders_created = 0
    notes_assigned = 0
    
    folder_name_to_id = {}
    for folder_data in suggested_folders:
        folder = storage.create_folder(
            name=folder_data['name'],
            color=folder_data.get('color')
        )
        folder_name_to_id[folder_data['name']] = folder['id']
        folders_created += 1
    
    for assignment in note_assignments:
        note_id = assignment['note_id']
        folder_names = assignment['folder_names']
        folder_ids = [folder_name_to_id.get(name) for name in folder_names if name in folder_name_to_id]
        
        if folder_ids:
            storage.set_note_folders(note_id, folder_ids)
            notes_assigned += 1
    
    return jsonify({
        "folders_created": folders_created,
        "notes_assigned": notes_assigned
    }), 200
