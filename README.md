# Quantum Algorithm Visualizer

Flask + React webapp for visualizing Deutsch-Jozsa quantum algorithm with classical brute force comparison.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

## Setup

### 1. Backend

```powershell
# Create venv (if not exists)
cd quantum-algo-visualizer
python -m venv venv

# Activate venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Frontend

```powershell
cd frontend
npm install
```

## Run

### Terminal 1: Backend

```powershell
cd backend
..\venv\Scripts\python.exe app.py
```

Backend runs at: http://127.0.0.1:5000

### Terminal 2: Frontend (Development)

```powershell
cd frontend
npm run dev
```

Frontend runs at: http://localhost:5173

**Note:** The frontend proxies API requests to the backend at port 5000.

## Project Structure

```
quantum-algo-visualizer/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── config.py           # Configuration
│   └── api/
│       ├── __init__.py     # Blueprint definition
│       └── dj.py           # Deutsch-Jozsa API
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dj/        # DJ visualization components
│   │   │   └── ui/        # Shared UI components
│   │   ├── hooks/          # React hooks
│   │   ├── services/       # API services
│   │   └── types/          # TypeScript types
│   ├── index.html
│   └── package.json
├── datasets/
│   └── dj/
│       ├── DJ-01.json      # Constant (n=3)
│       ├── DJ-02.json      # Balanced (n=3)
│       ├── DJ-03.json      # Constant (n=4)
│       ├── DJ-04.json      # Balanced (n=4)
│       └── results/         # Generated result JSONs
├── spec/                   # Specifications
└── venv/                  # Python virtual environment
```

## Features

### Classical Brute Force Visualization

Run step-by-step classical brute force algorithm and visualize the execution flow:

1. Select a case (DJ-01 through DJ-04)
2. Click **Jalankan** to run the algorithm
3. View the step-by-step visualization:
   - **INPUTS**: All possible inputs (2^n)
   - **ORACLE**: Each evaluation step with status
   - **RESULT**: Final decision (CONSTANT or BALANCED)
4. Download the visualization as PNG

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/dj/cases` | GET | List all DJ cases |
| `/api/dj/dataset/<case_id>` | GET | Get dataset for a case |
| `/api/dj/classic-run` | POST | Run classical brute force |
| `/api/dj/benchmark` | POST | Run quantum vs classical benchmark |

### Test Commands

```powershell
# Health check
curl http://127.0.0.1:5000/api/health

# List cases
curl http://127.0.0.1:5000/api/dj/cases

# Get dataset
curl http://127.0.0.1:5000/api/dj/dataset/DJ-01

# Run classical brute force
curl -X POST http://127.0.0.1:5000/api/dj/classic-run -H "Content-Type: application/json" -d "{\"case_id\": \"DJ-01\"}"

# Run benchmark (quantum vs classical)
curl -X POST http://127.0.0.1:5000/api/dj/benchmark -H "Content-Type: application/json" -d "{\"case_id\": \"DJ-01\", \"shots\": 1024}"
```

## Output Files

Classical brute force results are saved to:

```
datasets/dj/results/
├── DJ-01_classical.json   # Constant case, n=3
├── DJ-02_classical.json   # Balanced case, n=3
├── DJ-03_classical.json   # Constant case, n=4
└── DJ-04_classical.json   # Balanced case, n=4
```

These JSON files can be drag-dropped into `bab4/ilustrasi/dj_visualisasi_klasik.html` for standalone visualization.
