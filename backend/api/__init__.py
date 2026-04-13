from flask import Blueprint

api_bp = Blueprint('api', __name__, url_prefix='/api')

from . import dj
from . import qft
from . import vqe
from . import qaoa
