# Quantum Algorithm Visualizer - Scripts

## Quick Start

### Windows
```powershell
cd scripts
.\run.bat
```

### Linux / Mac
```bash
cd scripts
chmod +x run.sh
./run.sh
```

## Options

| Command | Description |
|---------|-------------|
| `./run.sh` | Start both backend and frontend |
| `./run.sh frontend` | Frontend only (port 5173) |
| `./run.sh backend` | Backend only (port 5000) |

## Requirements

### Backend
- Python 3.10+
- Virtual environment at `../venv`

### Frontend
- Node.js 18+
- npm dependencies installed (`cd ../frontend && npm install`)

## Ports

- **Backend:** http://127.0.0.1:5000
- **Frontend:** http://localhost:5173 (proxies API to backend)

## Notes

- Frontend hot-reloads on code changes
- Backend does NOT auto-reload (restart manually after changes)
- Windows script uses `start` to open separate terminal windows
- Linux/Mac runs in background with `&` for both processes
