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


@ai_bp.route('/classify/', methods=['POST'])
def classify_note():
    """Classify note as inspiration or task using GPT-5"""
    try:
        data = ClassifyNoteRequest.model_validate(request.json)
        
        note = storage.get_note(data.note_id)
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        
        result = gpt.classify_note(
            title=note.title,
            body=note.body
        )
        
        response = ClassifyResponse(**result)
        return jsonify(response.model_dump()), 200
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to classify note", details=str(e))
        return jsonify(error.model_dump()), 500


@ai_bp.route('/translate/', methods=['POST'])
def translate_note():
    try:
        data = TranslateNoteRequest.model_validate(request.json)
        
        note = storage.get_note(data.note_id)
        if not note:
            error = ErrorResponse(error="Note not found")
            return jsonify(error.model_dump()), 404
        
        result = gpt.translate_to_planner(
            title=note.title,
            body=note.body
        )
        
        response = TranslateResponse(**result)
        return jsonify(response.model_dump()), 200
    except ValidationError as e:
        error = ErrorResponse(error="Invalid request data", details=str(e))
        return jsonify(error.model_dump()), 400
    except Exception as e:
        error = ErrorResponse(error="Failed to translate note", details=str(e))
        return jsonify(error.model_dump()), 500