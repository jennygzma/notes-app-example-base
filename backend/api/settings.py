from flask import Blueprint, jsonify, request
from models.storage import storage
from datetime import datetime
import uuid

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')

DEFAULT_THEME = {
    'name': 'Default',
    'colors': {
        'primary': '#1976d2',
        'secondary': '#dc004e',
        'background': '#ffffff',
        'text': '#000000'
    },
    'font': 'Roboto'
}

def get_default_settings():
    return {
        'activeTheme': 'default',
        'themes': {
            'default': DEFAULT_THEME
        }
    }

def load_settings():
    settings = storage.load('settings')
    if not settings:
        settings = get_default_settings()
        storage.save('settings', settings)
    return settings

@settings_bp.route('/', methods=['GET'])
def get_settings():
    """Get all settings including active theme and all themes"""
    settings = load_settings()
    return jsonify(settings), 200

@settings_bp.route('/active/', methods=['PUT'])
def set_active_theme():
    """Set the active theme"""
    data = request.get_json()
    theme_id = data.get('theme_id')
    
    if not theme_id:
        return jsonify({'error': 'theme_id is required'}), 400
    
    settings = load_settings()
    
    if theme_id not in settings['themes']:
        return jsonify({'error': 'Theme not found'}), 404
    
    settings['activeTheme'] = theme_id
    storage.save('settings', settings)
    
    return jsonify(settings), 200

@settings_bp.route('/themes/', methods=['POST'])
def create_theme():
    """Create a new theme"""
    data = request.get_json()
    
    required_fields = ['name', 'colors', 'font']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'name, colors, and font are required'}), 400
    
    required_colors = ['primary', 'secondary', 'background', 'text']
    if not all(color in data['colors'] for color in required_colors):
        return jsonify({'error': 'All color fields are required'}), 400
    
    settings = load_settings()
    theme_id = str(uuid.uuid4())
    
    theme = {
        'name': data['name'],
        'colors': data['colors'],
        'font': data['font']
    }
    
    settings['themes'][theme_id] = theme
    storage.save('settings', settings)
    
    return jsonify({'theme_id': theme_id}), 201

@settings_bp.route('/themes/<theme_id>/', methods=['PUT'])
def update_theme(theme_id):
    """Update an existing theme"""
    data = request.get_json()
    
    settings = load_settings()
    
    if theme_id not in settings['themes']:
        return jsonify({'error': 'Theme not found'}), 404
    
    if theme_id == 'default':
        return jsonify({'error': 'Cannot modify default theme'}), 403
    
    if 'name' in data:
        settings['themes'][theme_id]['name'] = data['name']
    if 'colors' in data:
        settings['themes'][theme_id]['colors'] = data['colors']
    if 'font' in data:
        settings['themes'][theme_id]['font'] = data['font']
    
    storage.save('settings', settings)
    
    return jsonify(settings['themes'][theme_id]), 200

@settings_bp.route('/themes/<theme_id>/', methods=['DELETE'])
def delete_theme(theme_id):
    """Delete a theme"""
    settings = load_settings()
    
    if theme_id not in settings['themes']:
        return jsonify({'error': 'Theme not found'}), 404
    
    if theme_id == 'default':
        return jsonify({'error': 'Cannot delete default theme'}), 403
    
    # If this was the active theme, switch to default
    if settings['activeTheme'] == theme_id:
        settings['activeTheme'] = 'default'
    
    del settings['themes'][theme_id]
    storage.save('settings', settings)
    
    return '', 204

@settings_bp.route('/reset/', methods=['POST'])
def reset_to_default():
    """Reset settings to default (removes all custom themes)"""
    settings = get_default_settings()
    storage.save('settings', settings)
    
    return jsonify(settings), 200