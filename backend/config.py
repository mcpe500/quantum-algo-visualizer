import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-quantum-algo'
    DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')
    
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
    FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')
    DATASETS_DIR = os.path.join(BASE_DIR, 'datasets')
    NOTEBOOKS_DIR = os.path.join(BASE_DIR, 'notebooks')
    
    STATIC_FOLDER = os.path.join(FRONTEND_DIR, 'static')
    
    QISKIT_AER_BACKEND = 'aer_simulator'
    DEFAULT_SHOTS = 1024
    MAX_QUBITS = 20