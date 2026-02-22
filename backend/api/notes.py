from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from schemas import CreateNoteRequest, UpdateNoteRequest
from pydantic import ValidationError

notes_bp = Blueprint('notes', __name__)
storage = LocalStorage()

@notes_bp.route('/', methods=['GET'])
def get_notes():
    notes = storage.get_notes()
    return jsonify([note.model_dump() for note in notes]), 200

@notes_bp.route('/', methods=['POST'])
def create_note():
    try:
        req = CreateNoteRequest.model_validate(request.json)
        note = storage.create_note(
            title=req.title,
            body=req.body
        )
        return jsonify(note.model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400

@notes_bp.route('/<note_id>/', methods=['GET'])
def get_note(note_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    return jsonify(note.model_dump()), 200

@notes_bp.route('/<note_id>/', methods=['PUT'])
def update_note(note_id):
    try:
        req = UpdateNoteRequest.model_validate(request.json)
        note = storage.update_note(
            note_id=note_id,
            title=req.title,
            body=req.body,
            is_inspiration=req.is_inspiration,
            is_analyzed=req.is_analyzed
        )
        
        if not note:
            return jsonify({"error": "Note not found"}), 404
        return jsonify(note.model_dump()), 200
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400

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
    return jsonify(note.model_dump()), 200

@notes_bp.route('/<note_id>/links/', methods=['GET'])
def get_note_links(note_id):
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    links = storage.get_links_by_note(note_id)
    planner_items = []
    for link in links:
        item = storage.get_planner_item(link.planner_item_id)
        if item:
            planner_items.append(item.model_dump())
    
    return jsonify(planner_items), 200
