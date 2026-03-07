from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.note_service import NoteService
from services.planner_service import PlannerService
from schemas import (
    ClassifyNoteRequest,
    TranslateNoteRequest,
    ClassifyResponse,
    TranslateResponse,
    ProvideFeedbackRequest,
    FeedbackResponse,
    ErrorResponse
)

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
note_service = NoteService()
planner_service = PlannerService()


def handle_validation_error(e: ValidationError) -> tuple:
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@ai_bp.route('/classify/', methods=['POST'])
def classify_note():
    try:
        data = ClassifyNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    result = note_service.classify_note(data.note_id)
    if not result:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    return jsonify(ClassifyResponse.model_validate(result).model_dump()), 200


@ai_bp.route('/translate/', methods=['POST'])
def translate_note():
    try:
        data = TranslateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    result = planner_service.translate_note_to_task(data.note_id)
    if not result:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    return jsonify(TranslateResponse.model_validate(result).model_dump()), 200


@ai_bp.route('/feedback/', methods=['POST'])
def provide_feedback():
    try:
        data = ProvideFeedbackRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    result = note_service.provide_feedback(data.selected_text, data.feedback_type)
    
    return jsonify(FeedbackResponse.model_validate(result).model_dump()), 200
