from flask import Blueprint, request, jsonify
from models.storage import LocalStorage

settings_bp = Blueprint('settings', __name__, url_prefix='/api/settings')
storage = LocalStorage()

@settings_bp.route('/', methods=['GET'])
def get_settings():
    try:
        settings = storage.get_settings()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/active/', methods=['PUT'])
def update_active_theme():
    try:
        data = request.get_json()
        theme_id = data.get('theme_id')
        
        if not theme_id:
            return jsonify({"error": "theme_id is required"}), 400
        
        settings = storage.update_active_theme(theme_id)
        return jsonify(settings), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/themes/', methods=['POST'])
def create_theme():
    try:
        theme_data = request.get_json()
        theme_id = storage.create_theme(theme_data)
        return jsonify({"id": theme_id}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/themes/<theme_id>/', methods=['PUT'])
def update_theme(theme_id):
    try:
        theme_data = request.get_json()
        settings = storage.update_theme(theme_id, theme_data)
        return jsonify(settings), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/themes/<theme_id>/', methods=['DELETE'])
def delete_theme(theme_id):
    try:
        storage.delete_theme(theme_id)
        return '', 204
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@settings_bp.route('/reset/', methods=['POST'])
def reset_settings():
    try:
        settings = storage.reset_to_default()
        return jsonify(settings), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500