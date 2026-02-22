from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import (
    CreateNoteRequest,
    UpdateNoteRequest,
    PatchNoteRequest,
    NoteResponse,
    ErrorResponse
)

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')
storage = LocalStorage()


def handle_validation_error(e: ValidationError) -> tuple:
    """Helper to format Pydantic validation errors"""
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@notes_bp.route('/', methods=['GET'])
def get_notes():
    """Get all notes"""
    notes = storage.get_notes()
    return jsonify(notes), 200


@notes_bp.route('/', methods=['POST'])
def create_note():
    """Create a new note"""
    try:
        data = CreateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = storage.create_note(
        title=data.title,
        body=data.body
    )
    return jsonify(NoteResponse.model_validate(note).model_dump()), 201


@notes_bp.route('/<note_id>/', methods=['GET'])
def get_note(note_id: str):
    """Get a specific note"""
    note = storage.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return jsonify(NoteResponse.model_validate(note).model_dump()), 200


@notes_bp.route('/<note_id>/', methods=['PUT'])
def update_note(note_id: str):
    """Update a note"""
    try:
        data = UpdateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = storage.update_note(
        note_id=note_id,
        title=data.title,
        body=data.body
    )
    
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return jsonify(NoteResponse.model_validate(note).model_dump()), 200


@notes_bp.route('/<note_id>/', methods=['DELETE'])
def delete_note(note_id: str):
    """Delete a note"""
    success = storage.delete_note(note_id)
    if not success:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return '', 204


@notes_bp.route('/<note_id>/', methods=['PATCH'])
def patch_note(note_id: str):
    """Patch specific note fields"""
    try:
        data = PatchNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = storage.update_note(
        note_id=note_id,
        is_analyzed=data.is_analyzed,
        is_inspiration=data.is_inspiration
    )
    
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return jsonify(NoteResponse.model_validate(note).model_dump()), 200


@notes_bp.route('/<note_id>/links/', methods=['GET'])
def get_note_links(note_id: str):
    """Get planner items linked to this note"""
    note = storage.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    links = storage.get_links_by_note(note_id)
    planner_items = []
    for link in links:
        item = storage.get_planner_item(link['planner_item_id'])
        if item:
            planner_items.append(item)
    
    return jsonify(planner_items), 200