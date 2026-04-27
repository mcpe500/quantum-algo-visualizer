#!/bin/bash
# ============================================================
# Quantum Algorithm Visualizer - Run Script (Linux/Mac)
# ============================================================
# Usage:
#   ./run.sh              - Run both frontend and backend
#   ./run.sh frontend     - Run frontend only
#   ./run.sh backend      - Run backend only
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_DIR="$PROJECT_ROOT/venv"

show_usage() {
    echo "Usage: $0 [frontend|backend]"
    echo ""
    echo "Options:"
    echo "  (none)   Run both frontend and backend"
    echo "  frontend Run frontend dev server only"
    echo "  backend  Run backend server only"
    echo ""
    echo "Servers:"
    echo "  Backend:  http://127.0.0.1:5000"
    echo "  Frontend: http://localhost:5173"
}

run_backend() {
    echo "========================================"
    echo "Starting Backend Server..."
    echo "========================================"
    cd "$BACKEND_DIR"
    "$VENV_DIR/bin/python" app.py
}

run_frontend() {
    echo "========================================"
    echo "Starting Frontend Dev Server..."
    echo "========================================"
    cd "$FRONTEND_DIR"
    npm run dev
}

run_all() {
    echo "========================================"
    echo "Starting Backend Server..."
    echo "========================================"
    cd "$BACKEND_DIR"
    "$VENV_DIR/bin/python" app.py &
    BACKEND_PID=$!

    echo "Waiting 3 seconds for backend to start..."
    sleep 3

    echo ""
    echo "========================================"
    echo "Starting Frontend Dev Server..."
    echo "========================================"
    cd "$FRONTEND_DIR"
    npm run dev &
    FRONTEND_PID=$!

    echo ""
    echo "========================================"
    echo "Servers running:"
    echo "  Backend:  http://127.0.0.1:5000 (PID: $BACKEND_PID)"
    echo "  Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
    echo "========================================"
    echo ""
    echo "Press Ctrl+C to stop servers."

    # Wait for both processes
    wait
}

case "${1:-}" in
    frontend)
        run_frontend
        ;;
    backend)
        run_backend
        ;;
    "")
        run_all
        ;;
    help|-h|--help)
        show_usage
        ;;
    *)
        echo "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
