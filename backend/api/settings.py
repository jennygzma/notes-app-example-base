from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')
storage = LocalStorage()

@settings_bp.route('/', methods=['GET'])
def get_settings():
    """Get all settings (active theme + all themes)"""
    try:
        settings = storage.get_settings()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/active/', methods=['PUT'])
def set_active_theme():
    """Set active theme by ID"""
    try:
        data = request.get_json()
        theme_id = data.get('theme_id')
        
        if not theme_id:
            return jsonify({"error": "theme_id is required"}), 400
        
        settings = storage.update_active_theme(theme_id)
        return jsonify(settings), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/themes/', methods=['POST'])
def create_theme():
    """Create new theme (returns theme ID)"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({"error": "name is required"}), 400
        if not data.get('colors'):
            return jsonify({"error": "colors is required"}), 400
        if not data.get('font'):
            return jsonify({"error": "font is required"}), 400
        
        # Validate colors structure
        colors = data.get('colors')
        required_colors = ['primary', 'secondary', 'background', 'text']
        for color_key in required_colors:
            if color_key not in colors:
                return jsonify({"error": f"colors.{color_key} is required"}), 400
        
        theme_data = {
            "name": data.get('name'),
            "colors": colors,
            "font": data.get('font')
        }
        
        theme_id = storage.create_theme(theme_data)
        return jsonify({"theme_id": theme_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/themes/<theme_id>/', methods=['PUT'])
def update_theme(theme_id):
    """Update existing theme"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name'):
            return jsonify({"error": "name is required"}), 400
        if not data.get('colors'):
            return jsonify({"error": "colors is required"}), 400
        if not data.get('font'):
            return jsonify({"error": "font is required"}), 400
        
        # Validate colors structure
        colors = data.get('colors')
        required_colors = ['primary', 'secondary', 'background', 'text']
        for color_key in required_colors:
            if color_key not in colors:
                return jsonify({"error": f"colors.{color_key} is required"}), 400
        
        theme_data = {
            "name": data.get('name'),
            "colors": colors,
            "font": data.get('font')
        }
        
        settings = storage.update_theme(theme_id, theme_data)
        return jsonify(settings), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/themes/<theme_id>/', methods=['DELETE'])
def delete_theme(theme_id):
    """Delete theme (can't delete default)"""
    try:
        success = storage.delete_theme(theme_id)
        if success:
            return jsonify({"message": "Theme deleted successfully"}), 200
        else:
            return jsonify({"error": "Theme not found"}), 404
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/reset/', methods=['POST'])
def reset_to_default():
    """Reset to default theme only"""
    try:
        settings = storage.reset_to_default()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500