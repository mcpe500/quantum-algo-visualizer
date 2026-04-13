from flask import Flask
from flask_cors import CORS

from api import api_bp
from config import get_config


def create_app():
    app = Flask(__name__)
    app.config.from_object(get_config())
    CORS(app)
    app.register_blueprint(api_bp)
    return app