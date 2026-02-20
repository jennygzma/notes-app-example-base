from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
storage = LocalStorage()
gpt_client = GPTClient()

@folders_bp.route('/', methods=['GET'])
def get_folders():
    """Return all folders with note counts"""
    folders = storage.get_folders()
    
    for folder in folders:
        notes = storage.get_notes_in_folder(folder['id'])
        folder['note_count'] = len(notes)
    
    return jsonify(folders), 200

@folders_bp.route('/', methods=['POST'])
def create_folder():
    """Create new folder with name and optional color"""
    data = request.json
    name = data.get('name')
    color = data.get('color')
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    folder = storage.create_folder(name, color)
    return jsonify(folder), 201

@folders_bp.route('/<folder_id>/', methods=['DELETE'])
def delete_folder(folder_id):
    """Delete folder and remove all note-folder links"""
    success = storage.delete_folder(folder_id)
    if not success:
        return jsonify({"error": "Folder not found"}), 404
    return '', 204

@folders_bp.route('/organize/preview/', methods=['POST'])
def organize_preview():
    """Get unorganized notes and return AI organization preview"""
    try:
        unorganized = storage.get_unorganized_notes()
        
        if not unorganized:
            return jsonify({
                "suggested_folders": [],
                "assignments": [],
                "message": "No unorganized notes to organize"
            }), 200
        
        existing_folders = storage.get_folders()
        
        result = gpt_client.organize_notes(unorganized, existing_folders)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@folders_bp.route('/organize/apply/', methods=['POST'])
def organize_apply():
    """Accept organization preview and apply to database"""
    try:
        data = request.json
        suggested_folders = data.get('suggested_folders', [])
        assignments = data.get('assignments', [])
        
        folder_name_to_id = {}
        for folder_data in suggested_folders:
            existing = next((f for f in storage.get_folders() if f['name'] == folder_data['name']), None)
            if existing:
                folder_name_to_id[folder_data['name']] = existing['id']
            else:
                new_folder = storage.create_folder(folder_data['name'], folder_data.get('color'))
                folder_name_to_id[folder_data['name']] = new_folder['id']
        
        for assignment in assignments:
            note_id = assignment['note_id']
            folder_names = assignment['folder_names']
            
            for folder_name in folder_names:
                if folder_name in folder_name_to_id:
                    storage.add_note_to_folder(note_id, folder_name_to_id[folder_name])
        
        return jsonify({"message": "Organization applied successfully"}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500