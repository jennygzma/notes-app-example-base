from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from models.gpt_client import GPTClient
from schemas import (
    CategorizeNoteRequest,
    ApproveCategoryRequest,
    CategorizeResponse,
    ApproveCategoryResponse,
    CategoryResponse,
    InspirationResponse,
    ErrorResponse
)

inspirations_bp = Blueprint('inspirations', __name__, url_prefix='/api/inspirations')
storage = LocalStorage()
gpt = GPTClient()


def handle_validation_error(e: ValidationError) -> tuple:
    """Helper to format Pydantic validation errors"""
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@inspirations_bp.route('/', methods=['GET'])
def get_inspirations():
    """Get all inspirations grouped by category"""
    inspirations = storage.get_inspirations()
    notes = storage.get_notes()
    
    result = {}
    for insp in inspirations:
        note = next((n for n in notes if n['id'] == insp['note_id']), None)
        if note:
            category = insp['category']
            if category not in result:
                result[category] = []
            result[category].append({
                **note,
                'inspiration_id': insp['id'],
                'ai_confidence': insp['ai_confidence']
            })
    
    return jsonify(result), 200


@inspirations_bp.route('/note/<note_id>/', methods=['GET'])
def get_inspirations_by_note(note_id: str):
    """Get inspirations for a specific note"""
    inspirations = storage.get_inspirations_by_note(note_id)
    return jsonify(inspirations), 200


@inspirations_bp.route('/categorize/', methods=['POST'])
def categorize_note():
    """Categorize a note as an inspiration"""
    try:
        data = CategorizeNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = storage.get_note(data.note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    active_categories = storage.get_categories(status="active")
    category_names = [c['name'] for c in active_categories]
    
    result = gpt.categorize_note(
        title=note['title'],
        body=note['body'],
        existing_categories=category_names
    )
    
    is_new = result['is_new_category']
    category_name = result['category']
    
    if is_new:
        category = storage.create_category(
            name=category_name,
            status="pending_approval",
            discovered_by="ai"
        )
        response = CategorizeResponse(
            category=category_name,
            confidence=result['confidence'],
            is_new_category=True,
            category_id=category['id'],
            reasoning=result.get('reasoning'),
            status="pending_approval"
        )
        return jsonify(response.model_dump()), 200
    else:
        inspiration = storage.create_inspiration(
            note_id=data.note_id,
            category=category_name,
            ai_confidence=result['confidence']
        )
        # Mark note as inspiration and analyzed
        storage.update_note(data.note_id, is_inspiration=True, is_analyzed=True)
        
        response = CategorizeResponse(
            category=category_name,
            confidence=result['confidence'],
            is_new_category=False,
            inspiration_id=inspiration['id'],
            reasoning=result.get('reasoning'),
            status="created"
        )
        return jsonify(response.model_dump()), 201


@inspirations_bp.route('/categories/', methods=['GET'])
def get_categories():
    """Get all active categories"""
    categories = storage.get_categories(status="active")
    return jsonify(categories), 200


@inspirations_bp.route('/categories/pending/', methods=['GET'])
def get_pending_categories():
    """Get all pending approval categories"""
    categories = storage.get_categories(status="pending_approval")
    return jsonify(categories), 200


@inspirations_bp.route('/categories/<category_id>/approve/', methods=['POST'])
def approve_category(category_id: str):
    """Approve a pending category"""
    try:
        data = ApproveCategoryRequest.model_validate(request.json or {})
    except ValidationError as e:
        return handle_validation_error(e)
    
    category = storage.update_category_status(category_id, "active")
    if not category:
        return jsonify(ErrorResponse(error="Category not found").model_dump()), 404
    
    if data.note_id:
        note = storage.get_note(data.note_id)
        if note:
            inspiration = storage.create_inspiration(
                note_id=data.note_id,
                category=category['name'],
                ai_confidence=0.95
            )
            storage.update_note(data.note_id, is_inspiration=True, is_analyzed=True)
            
            response = ApproveCategoryResponse(
                category=CategoryResponse.model_validate(category),
                inspiration=InspirationResponse.model_validate(inspiration)
            )
            return jsonify(response.model_dump()), 201
    
    response = ApproveCategoryResponse(
        category=CategoryResponse.model_validate(category),
        inspiration=None
    )
    return jsonify(response.model_dump()), 200


@inspirations_bp.route('/categories/<category_id>/reject/', methods=['DELETE'])
def reject_category(category_id: str):
    """Reject and delete a pending category"""
    success = storage.delete_category(category_id)
    if not success:
        return jsonify(ErrorResponse(error="Category not found").model_dump()), 404
    return '', 204


@inspirations_bp.route('/<inspiration_id>/', methods=['DELETE'])
def delete_inspiration(inspiration_id: str):
    """Delete an inspiration"""
    success = storage.delete_inspiration(inspiration_id)
    if not success:
        return jsonify(ErrorResponse(error="Inspiration not found").model_dump()), 404
    return '', 204