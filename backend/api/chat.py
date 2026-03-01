from flask import Blueprint, request, jsonify
from services.chat_service import ChatService

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
chat_service = ChatService()


@chat_bp.route('/', methods=['POST'])
def send_message():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "message required"}), 400
    
    message = data['message']
    conversation_id = data.get('conversation_id')
    
    result = chat_service.chat(message, conversation_id)
    return jsonify(result), 200


@chat_bp.route('/conversations/', methods=['GET'])
def get_conversations():
    conversations = chat_service.get_conversations()
    return jsonify(conversations), 200


@chat_bp.route('/conversations/<conversation_id>/', methods=['GET'])
def get_conversation(conversation_id: str):
    conversation = chat_service.get_conversation(conversation_id)
    if not conversation:
        return jsonify({"error": "Conversation not found"}), 404
    return jsonify(conversation), 200


@chat_bp.route('/conversations/<conversation_id>/', methods=['DELETE'])
def delete_conversation(conversation_id: str):
    success = chat_service.delete_conversation(conversation_id)
    if not success:
        return jsonify({"error": "Conversation not found"}), 404
    return '', 204