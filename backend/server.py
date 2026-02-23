import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

from api.notes import notes_bp
from api.planner import planner_bp
from api.inspirations import inspirations_bp
from api.links import links_bp
from api.ai import ai_bp
from api.folders import folders_bp
from api.chat import chat_bp

load_dotenv()

app = Flask(__name__)
CORS(app)

app.register_blueprint(notes_bp)
app.register_blueprint(planner_bp)
app.register_blueprint(inspirations_bp)
app.register_blueprint(links_bp)
app.register_blueprint(ai_bp)
app.register_blueprint(folders_bp)
app.register_blueprint(chat_bp)

@app.route('/health', methods=['GET'])
def health_check():
    return {"status": "healthy"}, 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
