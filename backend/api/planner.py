from flask import Blueprint, request, jsonify
from models.storage import LocalStorage
from schemas import CreatePlannerItemRequest, UpdatePlannerItemRequest
from pydantic import ValidationError

planner_bp = Blueprint('planner', __name__)
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
    return jsonify([item.model_dump() for item in items]), 200

@planner_bp.route('/items/', methods=['POST'])
def create_planner_item():
    try:
        req = CreatePlannerItemRequest.model_validate(request.json)
        item = storage.create_planner_item(
            title=req.title,
            body=req.body,
            date=req.date,
            time=req.time,
            view_type=req.view_type
        )
        return jsonify(item.model_dump()), 201
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400

@planner_bp.route('/items/<item_id>/', methods=['GET'])
def get_planner_item(item_id):
    item = storage.get_planner_item(item_id)
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    return jsonify(item.model_dump()), 200

@planner_bp.route('/items/<item_id>/', methods=['PUT'])
def update_planner_item(item_id):
    try:
        req = UpdatePlannerItemRequest.model_validate(request.json)
        item = storage.update_planner_item(
            item_id,
            title=req.title,
            body=req.body,
            date=req.date,
            time=req.time,
            view_type=req.view_type,
            status=req.status
        )
        
        if not item:
            return jsonify({"error": "Planner item not found"}), 404
        return jsonify(item.model_dump()), 200
    except ValidationError as e:
        return jsonify({"error": "Validation failed", "details": e.errors()}), 400

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
    return jsonify(item.model_dump()), 200

@planner_bp.route('/items/<item_id>/links/', methods=['GET'])
def get_planner_item_links(item_id):
    item = storage.get_planner_item(item_id)
    if not item:
        return jsonify({"error": "Planner item not found"}), 404
    
    links = storage.get_links_by_planner_item(item_id)
    notes = []
    for link in links:
        note = storage.get_note(link.note_id)
        if note:
            notes.append(note.model_dump())
    
    return jsonify(notes), 200
