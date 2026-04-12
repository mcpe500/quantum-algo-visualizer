import os
from flask import Flask, jsonify, render_template
from flask_cors import CORS
from config import Config
from api import api_bp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

app = Flask(__name__, template_folder=os.path.join(FRONTEND_DIR, 'templates'))
app.config.from_object(Config)

CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

app.register_blueprint(api_bp)


@app.route('/api/health')
def health():
    return jsonify({
        'status': 'ok',
        'message': 'Quantum Algorithm Visualizer API is running'
    })


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)