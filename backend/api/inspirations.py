from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from models.gpt_client import GPTClient

inspirations_bp = Blueprint('inspirations', __name__, url_prefix='/api/inspirations')
storage = LocalStorage()
gpt = GPTClient()

@inspirations_bp.route('/', methods=['GET'])
def get_inspirations():
    inspirations = storage.get_inspirations()
    notes = storage.get_notes()
    
    result = {}
    for insp in inspirations:
        note = next((n for n in notes if n['id'] == insp['note_id']), None)
        if note:
            category = insp['category']
            if category not in result:
                result[category] = []
            result[category].append({
                **note,
                'inspiration_id': insp['id'],
                'ai_confidence': insp['ai_confidence']
            })
    
    return jsonify(result), 200

@inspirations_bp.route('/note/<note_id>/', methods=['GET'])
def get_inspirations_by_note(note_id):
    inspirations = storage.get_inspirations()
    note_inspirations = [insp for insp in inspirations if insp['note_id'] == note_id]
    return jsonify(note_inspirations), 200

@inspirations_bp.route('/categorize/', methods=['POST'])
def categorize_note():
    data = request.json
    note_id = data.get('note_id')
    
    if not note_id:
        return jsonify({"error": "note_id is required"}), 400
    
    note = storage.get_note(note_id)
    if not note:
        return jsonify({"error": "Note not found"}), 404
    
    active_categories = storage.get_categories(status="active")
    category_names = [c['name'] for c in active_categories]
    
    result = gpt.categorize_note(
        title=note['title'],
        body=note['body'],
        existing_categories=category_names
    )
    
    is_new = result['is_new_category']
    category_name = result['category']
    
    if is_new:
        category = storage.create_category(
            name=category_name,
            status="pending_approval",
            discovered_by="ai"
        )
        return jsonify({
            "category": category_name,
            "confidence": result['confidence'],
            "is_new_category": True,
            "category_id": category['id'],
            "reasoning": result.get('reasoning'),
            "status": "pending_approval"
        }), 200
    else:
        inspiration = storage.create_inspiration(
            note_id=note_id,
            category=category_name,
            ai_confidence=result['confidence']
        )
        # Mark note as inspiration and analyzed
        storage.update_note(note_id, is_inspiration=True, is_analyzed=True)
        
        return jsonify({
            "category": category_name,
            "confidence": result['confidence'],
            "is_new_category": False,
            "inspiration_id": inspiration['id'],
            "reasoning": result.get('reasoning'),
            "status": "created"
        }), 201

@inspirations_bp.route('/categories/', methods=['GET'])
def get_categories():
    categories = storage.get_categories(status="active")
    return jsonify(categories), 200

@inspirations_bp.route('/categories/pending/', methods=['GET'])
def get_pending_categories():
    categories = storage.get_categories(status="pending_approval")
    return jsonify(categories), 200

@inspirations_bp.route('/categories/<category_id>/approve/', methods=['POST'])
def approve_category(category_id):
    data = request.json
    note_id = data.get('note_id')
    
    category = storage.update_category_status(category_id, "active")
    if not category:
        return jsonify({"error": "Category not found"}), 404
    
    if note_id:
        note = storage.get_note(note_id)
        if note:
            inspiration = storage.create_inspiration(
                note_id=note_id,
                category=category['name'],
                ai_confidence=0.95
            )
            return jsonify({
                "category": category,
                "inspiration": inspiration
            }), 201
    
    return jsonify(category), 200

@inspirations_bp.route('/categories/<category_id>/reject/', methods=['DELETE'])
def reject_category(category_id):
    success = storage.delete_category(category_id)
    if not success:
        return jsonify({"error": "Category not found"}), 404
    return '', 204

@inspirations_bp.route('/<inspiration_id>/', methods=['DELETE'])
def delete_inspiration(inspiration_id):
    success = storage.delete_inspiration(inspiration_id)
    if not success:
        return jsonify({"error": "Inspiration not found"}), 404
    return '', 204
