from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from models.storage import LocalStorage
from models.gpt_client import GPTClient
from schemas import (
    ClassifyNoteRequest, TranslateNoteRequest,
    ClassifyResponse, TranslateResponse, ErrorResponse
)

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')
storage = LocalStorage()
gpt = GPTClient()


@ai_bp.route('/classify/', methods=['POST'])
def classify_note():
    try:
        data = ClassifyNoteRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    note = storage.get_note(data.note_id)
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    
    result = gpt.classify_note(
        title=note.title,
        body=note.body
    )
    
    return jsonify(result), 200


@ai_bp.route('/translate/', methods=['POST'])
def translate_note():
    try:
        data = TranslateNoteRequest.model_validate(request.json)
    except ValidationError as e:
        error = ErrorResponse(
            code='validation_error',
            message='Invalid request data',
            details=e.errors()
        )
        return jsonify(error.model_dump()), 422
    
    note = storage.get_note(data.note_id)
    if not note:
        error = ErrorResponse(code='not_found', message='Note not found')
        return jsonify(error.model_dump()), 404
    
    result = gpt.translate_to_planner(
        title=note.title,
        body=note.body
    )
    
    return jsonify(result), 200