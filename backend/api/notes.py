from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from schemas import (
    CreateNoteRequest, UpdateNoteRequest,
    NoteResponse, PlannerItemResponse, ErrorResponse
)

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')
storage = LocalStorage()


@notes_bp.route('/', methods=['GET'])
def get_notes():
    notes = storage.get_notes()
    return jsonify([n.model_dump() for n in notes]), 200


@notes_bp.route('/', methods=['POST'])
def create_note():
    try:
        data = CreateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    note = storage.create_note(title=data.title, body=data.body)
    return jsonify(note.model_dump()), 201


@notes_bp.route('/<note_id>/', methods=['GET'])
def get_note(note_id):
    note = storage.get_note(note_id)
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    return jsonify(note.model_dump()), 200


@notes_bp.route('/<note_id>/', methods=['PUT'])
def update_note(note_id):
    try:
        data = UpdateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    note = storage.update_note(
        note_id=note_id,
        title=data.title,
        body=data.body
    )
    
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    return jsonify(note.model_dump()), 200


@notes_bp.route('/<note_id>/', methods=['DELETE'])
def delete_note(note_id):
    success = storage.delete_note(note_id)
    if not success:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    return '', 204


@notes_bp.route('/<note_id>/', methods=['PATCH'])
def patch_note(note_id):
    try:
        data = UpdateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    note = storage.update_note(
        note_id=note_id,
        is_analyzed=data.is_analyzed
    )
    
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    return jsonify(note.model_dump()), 200


@notes_bp.route('/<note_id>/links/', methods=['GET'])
def get_note_links(note_id):
    note = storage.get_note(note_id)
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    
    links = storage.get_links_by_note(note_id)
    planner_items = []
    for link in links:
        item = storage.get_planner_item(link.planner_item_id)
        if item:
            planner_items.append(item.model_dump())
    
    return jsonify(planner_items), 200