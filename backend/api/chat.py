from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
storage = LocalStorage()
gpt_client = GPTClient()

@chat_bp.route('/sessions/', methods=['GET'])
def get_sessions():
    """Return all chat sessions"""
    sessions = storage.get_chat_sessions()
    return jsonify(sessions), 200

@chat_bp.route('/sessions/', methods=['POST'])
def create_session():
    """Create new chat session with auto-generated title"""
    data = request.json or {}
    title = data.get('title', 'New Chat')
    
    session = storage.create_chat_session(title)
    return jsonify(session), 201

@chat_bp.route('/sessions/<session_id>/', methods=['DELETE'])
def delete_session(session_id):
    """Delete session and all its messages"""
    success = storage.delete_chat_session(session_id)
    if not success:
        return jsonify({"error": "Session not found"}), 404
    return '', 204

@chat_bp.route('/sessions/<session_id>/messages/', methods=['GET'])
def get_messages(session_id):
    """Return all messages for this session"""
    session = storage.get_chat_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    messages = storage.get_chat_messages(session_id)
    return jsonify(messages), 200

@chat_bp.route('/query/', methods=['POST'])
def query():
    """
    Process a chat query using two-step RAG:
    1. Get conversation history from session
    2. Get all folders
    3. Call GPTClient.chat_step1_select_folders()
    4. Get notes from selected folders
    5. Call GPTClient.chat_step2_answer()
    6. Save user message to session
    7. Save assistant message with thinking to session
    8. Return assistant message
    """
    try:
        data = request.json
        session_id = data.get('session_id')
        question = data.get('question')
        
        if not session_id or not question:
            return jsonify({"error": "session_id and question are required"}), 400
        
        session = storage.get_chat_session(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404
        
        conversation_history = storage.get_chat_messages(session_id)
        
        all_folders = storage.get_folders()
        
        if not all_folders:
            return jsonify({
                "error": "No folders found. Please organize your notes into folders first."
            }), 400
        
        step1_result = gpt_client.chat_step1_select_folders(
            question=question,
            folders=all_folders,
            conversation_history=conversation_history
        )
        
        selected_folder_ids = step1_result.get('selected_folder_ids', [])
        step1_reasoning = step1_result.get('reasoning', '')
        
        selected_folders = [f for f in all_folders if f['id'] in selected_folder_ids]
        
        relevant_notes = []
        for folder in selected_folders:
            notes_in_folder = storage.get_notes_in_folder(folder['id'])
            relevant_notes.extend(notes_in_folder)
        
        relevant_notes = list({n['id']: n for n in relevant_notes}.values())
        
        if not relevant_notes:
            return jsonify({
                "error": "No notes found in the selected folders."
            }), 400
        
        step2_result = gpt_client.chat_step2_answer(
            question=question,
            notes=relevant_notes,
            conversation_history=conversation_history
        )
        
        answer = step2_result.get('answer', '')
        step2_reasoning = step2_result.get('reasoning', '')
        referenced_note_ids = step2_result.get('referenced_note_ids', [])
        
        storage.create_chat_message(
            session_id=session_id,
            role='user',
            content=question,
            thinking=None,
            referenced_note_ids=None
        )
        
        examined_notes = [{"id": n["id"], "title": n["title"]} for n in relevant_notes]
        
        thinking = {
            "step1_reasoning": step1_reasoning,
            "selected_folders": [{"id": f["id"], "name": f["name"]} for f in selected_folders],
            "step2_reasoning": step2_reasoning,
            "examined_notes": examined_notes
        }
        
        assistant_message = storage.create_chat_message(
            session_id=session_id,
            role='assistant',
            content=answer,
            thinking=thinking,
            referenced_note_ids=referenced_note_ids
        )
        
        return jsonify(assistant_message), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500