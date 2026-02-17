from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
storage = LocalStorage()
gpt = GPTClient()

@ai_bp.route('/classify/', methods=['POST'])
def classify_note():
    """Classify note as inspiration or task using GPT-5"""
    data = request.json
    note_id = data.get('note_id')
    
    if not note_id:
        return jsonify({"error": "note_id is required"}), 400
    
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    result = gpt.classify_note(
        title=note['title'],
        body=note['body']
    )
    
    return jsonify(result), 200

@ai_bp.route('/translate/', methods=['POST'])
def translate_note():
    data = request.json
    note_id = data.get('note_id')
    
    if not note_id:
        return jsonify({"error": "note_id is required"}), 400
    
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    result = gpt.translate_to_planner(
        title=note['title'],
        body=note['body']
    )
    
    return jsonify(result), 200
