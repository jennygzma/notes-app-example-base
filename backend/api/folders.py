from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
storage = LocalStorage()
gpt_client = GPTClient()

@folders_bp.route('/', methods=['GET'])
def get_folders():
    folders = storage.get_folders()
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
    return jsonify(folder), 201

@folders_bp.route('/<folder_id>/', methods=['GET'])
def get_folder(folder_id):
    folder = storage.get_folder(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    return jsonify(folder), 200

@folders_bp.route('/<folder_id>/', methods=['PUT'])
def update_folder(folder_id):
    data = request.json
    folder = storage.update_folder(
        folder_id=folder_id,
        name=data.get('name'),
        color=data.get('color')
    )
    
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    return jsonify(folder), 200

@folders_bp.route('/<folder_id>/', methods=['DELETE'])
def delete_folder(folder_id):
    success = storage.delete_folder(folder_id)
    if not success:
        return jsonify({"error": "Folder not found"}), 404
    return '', 204

@folders_bp.route('/<folder_id>/notes/', methods=['GET'])
def get_folder_notes(folder_id):
    folder = storage.get_folder(folder_id)
    if not folder:
        return jsonify({"error": "Folder not found"}), 404
    
    notes = storage.get_notes_in_folder(folder_id)
    return jsonify(notes), 200

@folders_bp.route('/unorganized/', methods=['GET'])
def get_unorganized_notes():
    notes = storage.get_unorganized_notes()
    return jsonify(notes), 200

@folders_bp.route('/organize/', methods=['POST'])
def organize_notes():
    unorganized = storage.get_unorganized_notes()
    
    if not unorganized:
        return jsonify({
            "suggested_folders": [],
            "assignments": [],
            "message": "No unorganized notes found"
        }), 200
    
    existing_folders = storage.get_folders()
    
    def estimate_tokens(notes):
        total = 0
        for note in notes:
            total += len(note.get('title', '')) + len(note.get('body', ''))
        return total // 4
    
    MAX_TOKENS = 150000
    estimated_tokens = estimate_tokens(unorganized)
    
    if estimated_tokens > MAX_TOKENS:
        chunk_size = len(unorganized) * MAX_TOKENS // estimated_tokens
        chunks = [unorganized[i:i + chunk_size] for i in range(0, len(unorganized), chunk_size)]
        
        all_suggested_folders = []
        all_assignments = []
        seen_folders = set()
        
        for chunk in chunks:
            result = gpt_client.organize_notes(chunk, existing_folders)
            
            for folder in result.get('suggested_folders', []):
                if folder['name'] not in seen_folders:
                    all_suggested_folders.append(folder)
                    seen_folders.add(folder['name'])
            
            all_assignments.extend(result.get('assignments', []))
        
        return jsonify({
            "suggested_folders": all_suggested_folders,
            "assignments": all_assignments
        }), 200
    else:
        result = gpt_client.organize_notes(unorganized, existing_folders)
        return jsonify(result), 200

@folders_bp.route('/organize/apply/', methods=['POST'])
def apply_organization():
    data = request.json
    suggested_folders = data.get('suggested_folders', [])
    assignments = data.get('assignments', [])
    
    folder_name_to_id = {}
    existing_folders = storage.get_folders()
    
    for existing in existing_folders:
        folder_name_to_id[existing['name']] = existing['id']
    
    for folder_data in suggested_folders:
        name = folder_data['name']
        if name not in folder_name_to_id:
            new_folder = storage.create_folder(
                name=name,
                color=folder_data.get('color')
            )
            folder_name_to_id[name] = new_folder['id']
    
    for assignment in assignments:
        note_id = assignment['note_id']
        folder_names = assignment['folder_names']
        
        for folder_name in folder_names:
            if folder_name in folder_name_to_id:
                storage.add_note_to_folder(note_id, folder_name_to_id[folder_name])
    
    return jsonify({"success": True}), 200
