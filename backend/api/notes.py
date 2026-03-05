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
    NoteListResponse,
    PlannerItemListResponse,
    NoteActivitiesResponse,
    OrganizationPlanRequest,
    OrganizationPreviewResponse,
    OrganizationApplyResponse,
    BulkMoveRequest,
    BulkMoveResponse,
    NoteVersionResponse,
    NoteVersionListResponse,
    SearchResultsResponse,
    DiffResponse,
    RevertRequest,
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
    return jsonify(NoteListResponse(notes=notes).model_dump()), 200


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
    
    note_service.repo.save_version(note_id)
    
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
    
    return jsonify(PlannerItemListResponse(items=planner_items).model_dump()), 200


@notes_bp.route('/activities/', methods=['GET'])
def get_notes_activities():
    date = request.args.get('date')
    if not date:
        return jsonify(ErrorResponse(error="date query parameter required").model_dump()), 400
    
    result = note_service.get_notes_by_activity_date(date)
    return jsonify(NoteActivitiesResponse.model_validate(result).model_dump()), 200


@notes_bp.route('/organize/preview/', methods=['POST'])
def organize_notes_preview():
    result = note_service.organize_notes_preview()
    return jsonify(OrganizationPreviewResponse.model_validate(result).model_dump()), 200


@notes_bp.route('/organize/apply/', methods=['POST'])
def apply_organization():
    try:
        plan = OrganizationPlanRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)

    result = note_service.apply_organization(plan.model_dump())
    return jsonify(OrganizationApplyResponse.model_validate(result).model_dump()), 200


@notes_bp.route('/bulk-move/', methods=['POST'])
def bulk_move_notes():
    try:
        data = BulkMoveRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)

    note_ids = data.note_ids
    folder_id = data.folder_id
    
    updated_count = 0
    for note_id in note_ids:
        note = note_service.update_note(note_id, folder_id=folder_id)
        if note:
            updated_count += 1
    
    return jsonify(BulkMoveResponse(updated=updated_count).model_dump()), 200


@notes_bp.route('/search/', methods=['GET'])
def search_notes():
    query = request.args.get('q', '')
    if not query:
        return jsonify(ErrorResponse(error="Query parameter 'q' is required").model_dump()), 400
    
    results = note_service.search_notes(query)
    return jsonify(SearchResultsResponse.model_validate(results).model_dump()), 200


@notes_bp.route('/<note_id>/versions/', methods=['GET'])
def get_note_versions(note_id: str):
    note = note_service.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    versions = note_service.get_note_versions(note_id)
    return jsonify(NoteVersionListResponse(versions=versions).model_dump()), 200


@notes_bp.route('/<note_id>/versions/<version_id>/', methods=['GET'])
def get_note_version(note_id: str, version_id: str):
    note = note_service.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    version = note_service.repo.get_version(version_id)
    if not version:
        return jsonify(ErrorResponse(error="Version not found").model_dump()), 404
    
    return jsonify(NoteVersionResponse.model_validate(version).model_dump()), 200


@notes_bp.route('/<note_id>/versions/<version_id>/diff/', methods=['GET'])
def get_version_diff(note_id: str, version_id: str):
    note = note_service.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    version = note_service.repo.get_version(version_id)
    if not version:
        return jsonify(ErrorResponse(error="Version not found").model_dump()), 404
    
    diff_chunks = note_service.compute_diff(note['body'], version['content'])
    return jsonify(DiffResponse(chunks=diff_chunks).model_dump()), 200


@notes_bp.route('/<note_id>/revert/', methods=['POST'])
def revert_to_version(note_id: str):
    try:
        data = RevertRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = note_service.get_note(note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    version = note_service.repo.get_version(data.version_id)
    if not version:
        return jsonify(ErrorResponse(error="Version not found").model_dump()), 404
    
    if data.paragraph_indices is not None:
        updated_note = note_service.revert_partial(note_id, data.version_id, data.paragraph_indices)
    else:
        note_service.repo.save_version(note_id)
        updated_note = note_service.update_note(
            note_id,
            title=version['title'],
            body=version['content'],
            folder_id=version['folder_id']
        )
    
    if not updated_note:
        return jsonify(ErrorResponse(error="Failed to revert note").model_dump()), 500
    
    return jsonify(NoteResponse.model_validate(updated_note).model_dump()), 200
