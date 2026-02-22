from flask import Blueprint, request, jsonify
from pydantic import ValidationError, BaseModel
from services.chat_service import ChatService
from schemas import ErrorResponse

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
chat_service = ChatService()


class ChatRequest(BaseModel):
    message: str


@chat_bp.route('/', methods=['POST'])
def chat():
    try:
        data = ChatRequest.model_validate(request.json)
    except ValidationError as e:
        errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
        return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400
    
    try:
        result = chat_service.chat(data.message)
        return jsonify(result), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Chat failed", details=str(e)).model_dump()), 500