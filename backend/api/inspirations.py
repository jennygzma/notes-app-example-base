from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.inspiration_service import InspirationService
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
inspiration_service = InspirationService()


def handle_validation_error(e: ValidationError) -> tuple:
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@inspirations_bp.route('/', methods=['GET'])
def get_inspirations():
    result = inspiration_service.get_all_grouped()
    return jsonify(result), 200


@inspirations_bp.route('/note/<note_id>/', methods=['GET'])
def get_inspirations_by_note(note_id: str):
    inspirations = inspiration_service.get_by_note_id(note_id)
    return jsonify(inspirations), 200


@inspirations_bp.route('/categorize/', methods=['POST'])
def categorize_note():
    try:
        data = CategorizeNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    result = inspiration_service.categorize_note(data.note_id)
    if not result:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    status_code = 200 if result.is_new_category else 201
    return jsonify(result.model_dump()), status_code


@inspirations_bp.route('/categories/', methods=['GET'])
def get_categories():
    categories = inspiration_service.get_categories(status="active")
    return jsonify(categories), 200


@inspirations_bp.route('/categories/pending/', methods=['GET'])
def get_pending_categories():
    categories = inspiration_service.get_categories(status="pending_approval")
    return jsonify(categories), 200


@inspirations_bp.route('/categories/<category_id>/approve/', methods=['POST'])
def approve_category(category_id: str):
    try:
        data = ApproveCategoryRequest.model_validate(request.json or {})
    except ValidationError as e:
        return handle_validation_error(e)
    
    category, inspiration = inspiration_service.approve_category(category_id, data.note_id)
    
    if not category:
        return jsonify(ErrorResponse(error="Category not found").model_dump()), 404
    
    # Construct response
    if inspiration:
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
    success = inspiration_service.reject_category(category_id)
    if not success:
        return jsonify(ErrorResponse(error="Category not found").model_dump()), 404
    return '', 204


@inspirations_bp.route('/<inspiration_id>/', methods=['DELETE'])
def delete_inspiration(inspiration_id: str):
    success = inspiration_service.delete_inspiration(inspiration_id)
    if not success:
        return jsonify(ErrorResponse(error="Inspiration not found").model_dump()), 404
    return '', 204
