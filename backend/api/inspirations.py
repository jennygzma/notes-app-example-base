from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from models.gpt_client import GPTClient
from schemas import (
    CategorizeNoteRequest,
    CategorizeResponse,
    CategoryResponse,
    InspirationResponse,
    ApproveCategoryResponse,
    ErrorResponse
)

inspirations_bp = Blueprint('inspirations', __name__, url_prefix='/api/inspirations')
storage = LocalStorage()
gpt = GPTClient()


@inspirations_bp.route('/', methods=['GET'])
def get_inspirations():
    try:
        inspirations = storage.get_inspirations()
        notes = storage.get_notes()
        
        result = {}
        for insp in inspirations:
            note = next((n for n in notes if n.id == insp.note_id), None)
            if note:
                category = insp.category
                if category not in result:
                    result[category] = []
                result[category].append({
                    **note.model_dump(),
                    'inspiration_id': insp.id,
                    'ai_confidence': insp.ai_confidence
                })
        
        return jsonify(result), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve inspirations", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/note/<note_id>/', methods=['GET'])
def get_inspirations_by_note(note_id):
    try:
        inspirations = storage.get_inspirations_by_note(note_id)
        return jsonify([insp.model_dump() for insp in inspirations]), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve inspirations by note", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/categorize/', methods=['POST'])
def categorize_note():
    try:
        data = CategorizeNoteRequest.model_validate(request.json)
        
        note = storage.get_note(data.note_id)
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        
        active_categories = storage.get_categories(status="active")
        category_names = [c.name for c in active_categories]
        
        result = gpt.categorize_note(
            title=note.title,
            body=note.body,
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
                category_id=category.id,
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
            storage.update_note(data.note_id, is_inspiration=True, is_analyzed=True)
            
            response = CategorizeResponse(
                category=category_name,
                confidence=result['confidence'],
                is_new_category=False,
                inspiration_id=inspiration.id,
                reasoning=result.get('reasoning'),
                status="created"
            )
            return jsonify(response.model_dump()), 201
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to categorize note", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/categories/', methods=['GET'])
def get_categories():
    try:
        categories = storage.get_categories(status="active")
        return jsonify([cat.model_dump() for cat in categories]), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve categories", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/categories/pending/', methods=['GET'])
def get_pending_categories():
    try:
        categories = storage.get_categories(status="pending_approval")
        return jsonify([cat.model_dump() for cat in categories]), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to retrieve pending categories", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/categories/<category_id>/approve/', methods=['POST'])
def approve_category(category_id):
    try:
        data = request.json or {}
        note_id = data.get('note_id')
        
        category = storage.update_category_status(category_id, "active")
        if not category:
            error = ErrorResponse(error="Category not found")
            return jsonify(error.model_dump()), 404
        
        if note_id:
            note = storage.get_note(note_id)
            if note:
                inspiration = storage.create_inspiration(
                    note_id=note_id,
                    category=category.name,
                    ai_confidence=0.95
                )
                response = ApproveCategoryResponse(
                    category=CategoryResponse(**category.model_dump()),
                    inspiration=InspirationResponse(**inspiration.model_dump())
                )
                return jsonify(response.model_dump()), 201
        
        response = ApproveCategoryResponse(
            category=CategoryResponse(**category.model_dump())
        )
        return jsonify(response.model_dump()), 200
    except Exception as e:
        error = ErrorResponse(error="Failed to approve category", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/categories/<category_id>/reject/', methods=['DELETE'])
def reject_category(category_id):
    try:
        success = storage.delete_category(category_id)
        if not success:
            error = ErrorResponse(error="Category not found")
            return jsonify(error.model_dump()), 404
        return '', 204
    except Exception as e:
        error = ErrorResponse(error="Failed to reject category", details=str(e))
        return jsonify(error.model_dump()), 500


@inspirations_bp.route('/<inspiration_id>/', methods=['DELETE'])
def delete_inspiration(inspiration_id):
    try:
        success = storage.delete_inspiration(inspiration_id)
        if not success:
            error = ErrorResponse(error="Inspiration not found")
            return jsonify(error.model_dump()), 404
        return '', 204
    except Exception as e:
        error = ErrorResponse(error="Failed to delete inspiration", details=str(e))
        return jsonify(error.model_dump()), 500