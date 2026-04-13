from flask import Blueprint

api_bp = Blueprint('api', __name__, url_prefix='/api')

from api.routes import dj  # noqa: F401,E402
from api.routes import qft  # noqa: F401,E402
from api.routes import vqe  # noqa: F401,E402
from api.routes import qaoa  # noqa: F401,E402
