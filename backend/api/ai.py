from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from models.gpt_client import GPTClient
from schemas import (
    ClassifyNoteRequest,
    TranslateNoteRequest,
    ClassifyResponse,
    TranslateResponse,
    ErrorResponse
)

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
storage = LocalStorage()
gpt = GPTClient()


def handle_validation_error(e: ValidationError) -> tuple:
    """Helper to format Pydantic validation errors"""
    errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
    return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400


@ai_bp.route('/classify/', methods=['POST'])
def classify_note():
    """Classify note as inspiration or task using GPT"""
    try:
        data = ClassifyNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = storage.get_note(data.note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    result = gpt.classify_note(
        title=note['title'],
        body=note['body']
    )
    
    return jsonify(ClassifyResponse.model_validate(result).model_dump()), 200


@ai_bp.route('/translate/', methods=['POST'])
def translate_note():
    """Translate note to planner item suggestions"""
    try:
        data = TranslateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        return handle_validation_error(e)
    
    note = storage.get_note(data.note_id)
    if not note:
        return jsonify(ErrorResponse(error="Note not found").model_dump()), 404
    
    result = gpt.translate_to_planner(
        title=note['title'],
        body=note['body']
    )
    
    return jsonify(TranslateResponse.model_validate(result).model_dump()), 200