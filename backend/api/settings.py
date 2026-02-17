from flask import Blueprint, request, jsonify
from models.storage import LocalStorage, DEFAULT_THEME
import uuid

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')
storage = LocalStorage()

@settings_bp.route('/', methods=['GET'])
def get_settings():
    settings = storage.read_settings()
    return jsonify(settings), 200

@settings_bp.route('/active/', methods=['PUT'])
def set_active_theme():
    data = request.get_json()
    theme_id = data.get('theme_id')
    
    if not theme_id:
        return jsonify({"error": "theme_id is required"}), 400
    
    settings = storage.read_settings()
    theme_exists = any(theme['id'] == theme_id for theme in settings['themes'])
    
    if not theme_exists:
        return jsonify({"error": "Theme not found"}), 404
    
    settings['active_theme_id'] = theme_id
    storage.write_settings(settings)
    
    return '', 204

@settings_bp.route('/themes/', methods=['POST'])
def create_theme():
    data = request.get_json()
    
    name = data.get('name')
    colors = data.get('colors')
    font = data.get('font')
    
    if not name or not colors or not font:
        return jsonify({"error": "name, colors, and font are required"}), 400
    
    theme_id = str(uuid.uuid4())
    new_theme = {
        "id": theme_id,
        "name": name,
        "colors": colors,
        "font": font
    }
    
    settings = storage.read_settings()
    settings['themes'].append(new_theme)
    storage.write_settings(settings)
    
    return jsonify({"theme_id": theme_id}), 201

@settings_bp.route('/themes/<theme_id>/', methods=['PUT'])
def update_theme(theme_id):
    data = request.get_json()
    
    settings = storage.read_settings()
    theme_found = False
    
    for theme in settings['themes']:
        if theme['id'] == theme_id:
            theme_found = True
            if 'name' in data:
                theme['name'] = data['name']
            if 'colors' in data:
                theme['colors'] = data['colors']
            if 'font' in data:
                theme['font'] = data['font']
            break
    
    if not theme_found:
        return jsonify({"error": "Theme not found"}), 404
    
    storage.write_settings(settings)
    return '', 204

@settings_bp.route('/themes/<theme_id>/', methods=['DELETE'])
def delete_theme(theme_id):
    if theme_id == 'default':
        return jsonify({"error": "Cannot delete default theme"}), 400
    
    settings = storage.read_settings()
    
    initial_count = len(settings['themes'])
    settings['themes'] = [theme for theme in settings['themes'] if theme['id'] != theme_id]
    
    if len(settings['themes']) == initial_count:
        return jsonify({"error": "Theme not found"}), 404
    
    if settings['active_theme_id'] == theme_id:
        settings['active_theme_id'] = 'default'
    
    storage.write_settings(settings)
    return '', 204

@settings_bp.route('/reset/', methods=['POST'])
def reset_settings():
    default_settings = {
        "active_theme_id": "default",
        "themes": [DEFAULT_THEME]
    }
    storage.write_settings(default_settings)
    return '', 204
