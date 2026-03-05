from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from services.chat_service import ChatService
from schemas import ChatMessageRequest, ChatResponse, Conversation, ConversationListResponse, ErrorResponse

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
chat_service = ChatService()


@chat_bp.route('/', methods=['POST'])
def send_message():
    try:
        data = ChatMessageRequest.model_validate(request.json)
    except ValidationError as e:
        errors = '; '.join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
        return jsonify(ErrorResponse(error="Validation error", details=errors).model_dump()), 400

    result = chat_service.chat(data.message, data.conversation_id)
    return jsonify(ChatResponse.model_validate(result).model_dump()), 200


@chat_bp.route('/conversations/', methods=['GET'])
def get_conversations():
    conversations = chat_service.get_conversations()
    return jsonify(ConversationListResponse(conversations=conversations).model_dump()), 200


@chat_bp.route('/conversations/<conversation_id>/', methods=['GET'])
def get_conversation(conversation_id: str):
    conversation = chat_service.get_conversation(conversation_id)
    if not conversation:
        return jsonify(ErrorResponse(error="Conversation not found").model_dump()), 404
    return jsonify(Conversation.model_validate(conversation).model_dump()), 200


@chat_bp.route('/conversations/<conversation_id>/', methods=['DELETE'])
def delete_conversation(conversation_id: str):
    success = chat_service.delete_conversation(conversation_id)
    if not success:
        return jsonify(ErrorResponse(error="Conversation not found").model_dump()), 404
    return '', 204
