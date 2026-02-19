from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
storage = LocalStorage()

@folders_bp.route('/', methods=['GET'])
def get_folders():
    folders = storage.get_folders()
    return jsonify(folders), 200

@folders_bp.route('/', methods=['POST'])
def create_folder():
    data = request.json
    
    if not data or not data.get('name'):
        return jsonify({"error": "name is required"}), 400
    
    try:
        folder = storage.create_folder(
            name=data['name'],
            color=data.get('color')
        )
        return jsonify(folder), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@folders_bp.route('/<folder_id>/', methods=['DELETE'])
def delete_folder(folder_id):
    success = storage.delete_folder(folder_id)
    if not success:
        return jsonify({"error": "Folder not found"}), 404
    return '', 204

@folders_bp.route('/organize/', methods=['POST'])
def organize_folders():
    data = request.json or {}
    dry_run = data.get('dry_run', True)
    note_ids = data.get('note_ids')
    provided_result = data.get('result')
    
    try:
        if provided_result:
            result = provided_result
        else:
            if note_ids:
                notes = [storage.get_note(nid) for nid in note_ids]
                notes = [n for n in notes if n]
            else:
                notes = storage.get_unorganized_notes()
            
            if not notes:
                return jsonify({
                    "suggested_folders": [],
                    "note_assignments": []
                }), 200
            
            from models.gpt_client import GPTClient
            gpt_client = GPTClient()
            
            result = gpt_client.organize_notes(notes, storage.get_folders())
        
        if not dry_run:
            for folder_data in result.get('suggested_folders', []):
                existing_folders = storage.get_folders()
                folder_exists = any(f['name'].lower() == folder_data['name'].lower() for f in existing_folders)
                
                if not folder_exists:
                    storage.create_folder(
                        name=folder_data['name'],
                        color=folder_data.get('color')
                    )
            
            for assignment in result.get('note_assignments', []):
                note_id = assignment['note_id']
                folder_names = assignment['folder_names']
                
                all_folders = storage.get_folders()
                folder_ids = []
                for fname in folder_names:
                    folder = next((f for f in all_folders if f['name'].lower() == fname.lower()), None)
                    if folder:
                        folder_ids.append(folder['id'])
                
                if folder_ids:
                    storage.set_note_folders(note_id, folder_ids)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500