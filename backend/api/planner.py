from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

planner_bp = Blueprint('planner', __name__, url_prefix='/api/planner')
storage = LocalStorage()

@planner_bp.route('/items/', methods=['GET'])
def get_planner_items():
    date_start = request.args.get('date_start')
    date_end = request.args.get('date_end')
    view_type = request.args.get('view_type')
    status = request.args.get('status')
    
    items = storage.get_planner_items(
        date_start=date_start,
        date_end=date_end,
        view_type=view_type,
        status=status
    )
    return jsonify(items), 200

@planner_bp.route('/items/', methods=['POST'])
def create_planner_item():
    data = request.json
    
    required = ['title', 'body', 'date', 'view_type']
    if not all(data.get(field) for field in required):
        return jsonify({"error": f"Required fields: {', '.join(required)}"}), 400
    
    item = storage.create_planner_item(
        title=data['title'],
        body=data['body'],
        date=data['date'],
        time=data.get('time'),
        view_type=data['view_type']
    )
    return jsonify(item), 201

@planner_bp.route('/items/<item_id>/', methods=['GET'])
def get_planner_item(item_id):
    item = storage.get_planner_item(item_id)
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    return jsonify(item), 200

@planner_bp.route('/items/<item_id>/', methods=['PUT'])
def update_planner_item(item_id):
    data = request.json
    item = storage.update_planner_item(item_id, **data)
    
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    return jsonify(item), 200

@planner_bp.route('/items/<item_id>/', methods=['DELETE'])
def delete_planner_item(item_id):
    success = storage.delete_planner_item(item_id)
    if not success:
        return jsonify({"error": "Planner item not found"}), 404
    return '', 204

@planner_bp.route('/items/<item_id>/complete/', methods=['PATCH'])
def toggle_completion(item_id):
    item = storage.toggle_planner_item_status(item_id)
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    return jsonify(item), 200

@planner_bp.route('/items/<item_id>/links/', methods=['GET'])
def get_planner_item_links(item_id):
    item = storage.get_planner_item(item_id)
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    
    links = storage.get_links_by_planner_item(item_id)
    notes = []
    for link in links:
        note = storage.get_note(link['note_id'])
        if note:
            notes.append(note)
    
    return jsonify(notes), 200
