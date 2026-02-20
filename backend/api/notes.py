from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import (
    CreateNoteRequest,
    UpdateNoteRequest,
    NoteResponse,
    ErrorResponse
)

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')
storage = LocalStorage()


@notes_bp.route('/', methods=['GET'])
def get_notes():
    try:
        notes = storage.get_notes()
        return jsonify([note.model_dump() for note in notes]), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve notes", details=str(e))
        return jsonify(error.model_dump()), 500


@notes_bp.route('/', methods=['POST'])
def create_note():
    try:
        data = CreateNoteRequest.model_validate(request.json)
        note = storage.create_note(title=data.title, body=data.body)
        return jsonify(note.model_dump()), 201
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to create note", details=str(e))
        return jsonify(error.model_dump()), 500


@notes_bp.route('/<note_id>/', methods=['GET'])
def get_note(note_id):
    try:
        note = storage.get_note(note_id)
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        return jsonify(note.model_dump()), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve note", details=str(e))
        return jsonify(error.model_dump()), 500


@notes_bp.route('/<note_id>/', methods=['PUT'])
def update_note(note_id):
    try:
        data = UpdateNoteRequest.model_validate(request.json)
        note = storage.update_note(
            note_id=note_id,
            title=data.title,
            body=data.body
        )
        
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        return jsonify(note.model_dump()), 200
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to update note", details=str(e))
        return jsonify(error.model_dump()), 500


@notes_bp.route('/<note_id>/', methods=['DELETE'])
def delete_note(note_id):
    try:
        success = storage.delete_note(note_id)
        if not success:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        return '', 204
    except Exception as e:
        error = ErrorResponse(error="Failed to delete note", details=str(e))
        return jsonify(error.model_dump()), 500


@notes_bp.route('/<note_id>/', methods=['PATCH'])
def patch_note(note_id):
    try:
        data = UpdateNoteRequest.model_validate(request.json)
        note = storage.update_note(
            note_id=note_id,
            is_analyzed=data.is_analyzed
        )
        
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        return jsonify(note.model_dump()), 200
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to update note", details=str(e))
        return jsonify(error.model_dump()), 500


@notes_bp.route('/<note_id>/links/', methods=['GET'])
def get_note_links(note_id):
    try:
        note = storage.get_note(note_id)
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        
        links = storage.get_links_by_note(note_id)
        planner_items = []
        for link in links:
            item = storage.get_planner_item(link.planner_item_id)
            if item:
                planner_items.append(item.model_dump())
        
        return jsonify(planner_items), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve note links", details=str(e))
        return jsonify(error.model_dump()), 500