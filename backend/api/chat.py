from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')
storage = LocalStorage()
gpt_client = GPTClient()

@chat_bp.route('/sessions/', methods=['GET'])
def get_sessions():
    sessions = storage.get_chat_sessions()
    sessions.sort(key=lambda x: x['updated_at'], reverse=True)
    return jsonify(sessions), 200

@chat_bp.route('/sessions/', methods=['POST'])
def create_session():
    data = request.json or {}
    title = data.get('title', 'New Chat')
    session = storage.create_chat_session(title=title)
    return jsonify(session), 201

@chat_bp.route('/sessions/<session_id>/', methods=['DELETE'])
def delete_session(session_id):
    session = storage.get_chat_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    success = storage.delete_chat_session(session_id)
    if not success:
        return jsonify({"error": "Failed to delete session"}), 500
    
    return '', 204

@chat_bp.route('/sessions/<session_id>/messages/', methods=['GET'])
def get_messages(session_id):
    session = storage.get_chat_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    messages = storage.get_chat_messages(session_id)
    return jsonify(messages), 200

@chat_bp.route('/query/', methods=['POST'])
def query():
    data = request.json
    
    if not data or 'session_id' not in data or 'question' not in data:
        return jsonify({"error": "session_id and question are required"}), 400
    
    session_id = data['session_id']
    question = data['question']
    
    session = storage.get_chat_session(session_id)
    if not session:
        return jsonify({"error": "Session not found"}), 404
    
    storage.create_chat_message(
        session_id=session_id,
        role='user',
        content=question
    )
    
    conversation_history = storage.get_chat_messages(session_id)
    
    all_folders = storage.get_folders()
    all_notes = storage.get_notes()
    
    if not all_folders and not all_notes:
        response_message = storage.create_chat_message(
            session_id=session_id,
            role='assistant',
            content="You don't have any notes or folders yet. Create some notes first, and I'll be able to help you find information!",
            thinking=None,
            referenced_note_ids=[]
        )
        return jsonify(response_message), 200
    
    step1_result = gpt_client.chat_step1_select_folders(
        question=question,
        folders=all_folders,
        conversation_history=conversation_history
    )
    
    selected_folder_ids = step1_result.get('selected_folder_ids', [])
    step1_reasoning = step1_result.get('reasoning', '')
    
    relevant_notes = []
    if selected_folder_ids:
        relevant_note_ids = set()
        for folder_id in selected_folder_ids:
            note_ids = storage.get_notes_for_folder(folder_id)
            relevant_note_ids.update(note_ids)
        
        relevant_notes = [note for note in all_notes if note['id'] in relevant_note_ids]
    else:
        relevant_notes = all_notes
    
    if not relevant_notes:
        selected_folder_details = [
            {"id": f['id'], "name": f['name']} 
            for f in all_folders if f['id'] in selected_folder_ids
        ]
        
        response_message = storage.create_chat_message(
            session_id=session_id,
            role='assistant',
            content="I couldn't find any notes in the selected folders to answer your question. Try adding more notes or rephrasing your question.",
            thinking={
                "step1_reasoning": step1_reasoning,
                "selected_folders": selected_folder_details,
                "step2_reasoning": "No notes found in selected folders",
                "examined_notes": []
            },
            referenced_note_ids=[]
        )
        return jsonify(response_message), 200
    
    step2_result = gpt_client.chat_step2_answer(
        question=question,
        notes=relevant_notes,
        conversation_history=conversation_history
    )
    
    answer = step2_result.get('answer', 'I was unable to generate an answer.')
    step2_reasoning = step2_result.get('reasoning', '')
    referenced_note_ids = step2_result.get('referenced_note_ids', [])
    
    selected_folder_details = [
        {"id": f['id'], "name": f['name']} 
        for f in all_folders if f['id'] in selected_folder_ids
    ]
    
    examined_note_details = [
        {"id": note['id'], "title": note.get('title', 'Untitled')}
        for note in relevant_notes
    ]
    
    thinking = {
        "step1_reasoning": step1_reasoning,
        "selected_folders": selected_folder_details,
        "step2_reasoning": step2_reasoning,
        "examined_notes": examined_note_details
    }
    
    response_message = storage.create_chat_message(
        session_id=session_id,
        role='assistant',
        content=answer,
        thinking=thinking,
        referenced_note_ids=referenced_note_ids
    )
    
    return jsonify(response_message), 200