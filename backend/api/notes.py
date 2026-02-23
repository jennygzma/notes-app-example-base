from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.note_service import NoteService
from services.link_service import LinkService
from services.planner_service import PlannerService
from schemas import (
    CreateNoteRequest,
    UpdateNoteRequest,
    PatchNoteRequest,
    NoteResponse,
    ErrorResponse
)

notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')
note_service = NoteService()
link_service = LinkService()
planner_service = PlannerService()


def handle_validation_error(e: ValidationError) -> tuple:
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@notes_bp.route('/', methods=['GET'])
def get_notes():
    notes = note_service.get_notes()
    return jsonify(notes), 200


@notes_bp.route('/', methods=['POST'])
def create_note():
    try:
        data = CreateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = note_service.create_note(
        title=data.title,
        body=data.body
    )
    return jsonify(NoteResponse.model_validate(note).model_dump()), 201


@notes_bp.route('/<note_id>/', methods=['GET'])
def get_note(note_id: str):
    note = note_service.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return jsonify(NoteResponse.model_validate(note).model_dump()), 200


@notes_bp.route('/<note_id>/', methods=['PUT'])
def update_note(note_id: str):
    try:
        data = UpdateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = note_service.update_note(
        note_id=note_id,
        title=data.title,
        body=data.body
    )
    
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return jsonify(NoteResponse.model_validate(note).model_dump()), 200


@notes_bp.route('/<note_id>/', methods=['DELETE'])
def delete_note(note_id: str):
    success = note_service.delete_note(note_id)
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
    
    note = note_service.update_note(
        note_id=note_id,
        is_analyzed=data.is_analyzed,
        is_inspiration=data.is_inspiration
    )
    
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    return jsonify(NoteResponse.model_validate(note).model_dump()), 200


@notes_bp.route('/<note_id>/links/', methods=['GET'])
def get_note_links(note_id: str):
    note = note_service.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    links = link_service.get_links_by_note(note_id)
    planner_items = []
    for link in links:
        item = planner_service.get_item(link['planner_item_id'])
        if item:
            planner_items.append(item)
    
    return jsonify(planner_items), 200


@notes_bp.route('/activities/', methods=['GET'])
def get_note_activities():
    date = request.args.get('date')
    if not date:
        return jsonify(ErrorResponse(error="date parameter required").model_dump()), 400
    
    result = note_service.get_notes_by_activity_date(date)
    return jsonify(result), 200


@notes_bp.route('/organize/preview/', methods=['POST'])
def organize_notes_preview():
    result = note_service.organize_notes_preview()
    return jsonify(result), 200


@notes_bp.route('/organize/apply/', methods=['POST'])
def apply_organization():
    plan = request.json
    if not plan:
        return jsonify(ErrorResponse(error="No plan provided").model_dump()), 400
    
    result = note_service.apply_organization(plan)
    return jsonify(result), 200


@notes_bp.route('/bulk-move/', methods=['POST'])
def bulk_move_notes():
    data = request.json
    if not data or 'note_ids' not in data:
        return jsonify(ErrorResponse(error="note_ids required").model_dump()), 400
    
    note_ids = data['note_ids']
    folder_id = data.get('folder_id')
    
    updated_count = 0
    for note_id in note_ids:
        note = note_service.update_note(note_id, folder_id=folder_id)
        if note:
            updated_count += 1
    
    return jsonify({"updated": updated_count}), 200
