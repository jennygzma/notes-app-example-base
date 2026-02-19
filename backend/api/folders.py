from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient
import os

folders_bp = Blueprint('folders', __name__, url_prefix='/api/folders')
storage = LocalStorage()
gpt_client = GPTClient(api_key=os.getenv('OPENAI_API_KEY'))

@folders_bp.route('/', methods=['GET'])
def get_folders():
    folders = storage.get_folders()
    return jsonify(folders), 200

@folders_bp.route('/', methods=['POST'])
def create_folder():
    data = request.json
    name = data.get('name')
    color = data.get('color')
    
    if not name:
        return jsonify({"error": "Name is required"}), 400
    
    folder = storage.create_folder(name, color)
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
    name = data.get('name')
    color = data.get('color')
    
    folder = storage.update_folder(folder_id, name, color)
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
    notes = storage.get_notes_in_folder(folder_id)
    return jsonify(notes), 200

@folders_bp.route('/unorganized/', methods=['GET'])
def get_unorganized_notes():
    notes = storage.get_unorganized_notes()
    return jsonify(notes), 200

@folders_bp.route('/organize/', methods=['POST'])
def organize_notes():
    try:
        unorganized = storage.get_unorganized_notes()
        
        if not unorganized:
            return jsonify({
                "suggested_folders": [],
                "assignments": [],
                "message": "No unorganized notes to organize"
            }), 200
        
        existing_folders = storage.get_folders()
        
        with open('backend/prompts/organize_notes.txt', 'r') as f:
            prompt_template = f.read()
        
        notes_text = ""
        for note in unorganized:
            notes_text += f"\nNote ID: {note['id']}\nTitle: {note['title']}\nContent: {note['body']}\n---"
        
        folders_text = ""
        if existing_folders:
            folders_text = "Existing folders:\n"
            for folder in existing_folders:
                folders_text += f"- {folder['name']}\n"
        else:
            folders_text = "No existing folders yet."
        
        prompt = prompt_template.replace("{notes}", notes_text).replace("{existing_folders}", folders_text)
        
        response = gpt_client.chat([
            {"role": "system", "content": "You are an expert at organizing notes into meaningful folders."},
            {"role": "user", "content": prompt}
        ])
        
        result = gpt_client.extract_json(response)
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@folders_bp.route('/organize/apply/', methods=['POST'])
def apply_organization():
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

@folders_bp.route('/<folder_id>/notes/<note_id>/', methods=['POST'])
def add_note_to_folder(folder_id, note_id):
    result = storage.add_note_to_folder(note_id, folder_id)
    return jsonify(result), 201

@folders_bp.route('/<folder_id>/notes/<note_id>/', methods=['DELETE'])
def remove_note_from_folder(folder_id, note_id):
    success = storage.remove_note_from_folder(note_id, folder_id)
    if not success:
        return jsonify({"error": "Association not found"}), 404
    return '', 204