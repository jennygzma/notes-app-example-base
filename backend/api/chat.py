from flask import Blueprint, request, jsonify
from services.chat_service import ChatService
from schemas import ErrorResponse

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
chat_service = ChatService()


@chat_bp.route('/', methods=['POST'])
def send_message():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify(ErrorResponse(error="Message is required").model_dump()), 400
        
        message = data['message']
        conversation_id = data.get('conversation_id')
        
        result = chat_service.chat(message, conversation_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Failed to process message", details=str(e)).model_dump()), 500


@chat_bp.route('/conversations/', methods=['GET'])
def get_conversations():
    try:
        conversations = chat_service.get_conversations()
        return jsonify(conversations), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Failed to load conversations", details=str(e)).model_dump()), 500


@chat_bp.route('/conversations/<conversation_id>/', methods=['GET'])
def get_conversation(conversation_id: str):
    try:
        conversation = chat_service.get_conversation(conversation_id)
        if not conversation:
            return jsonify(ErrorResponse(error="Conversation not found").model_dump()), 404
        return jsonify(conversation), 200
    except Exception as e:
        return jsonify(ErrorResponse(error="Failed to load conversation", details=str(e)).model_dump()), 500


@chat_bp.route('/conversations/<conversation_id>/', methods=['DELETE'])
def delete_conversation(conversation_id: str):
    try:
        success = chat_service.delete_conversation(conversation_id)
        if not success:
            return jsonify(ErrorResponse(error="Conversation not found").model_dump()), 404
        return '', 204
    except Exception as e:
        return jsonify(ErrorResponse(error="Failed to delete conversation", details=str(e)).model_dump()), 500