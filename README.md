# Quantum Algorithm Visualizer

Flask + React webapp untuk memvisualisasikan dan membandingkan empat algoritma kuantum utama dengan pendekatan klasik.

## Empat Algoritma

| Algoritma | Kategori | Klasik | Kuantum | Dataset Page |
|-----------|----------|--------|---------|-------------|
| **Deutsch-Jozsa** | Oracle classification | Brute Force | DJ Circuit | `/dj/dataset` |
| **Quantum Fourier Transform** | Signal processing | FFT | QFT Circuit | `/qft/dataset` |
| **Variational Quantum Eigensolver** | Molecular simulation | FCI (Exact Diagonalization) | VQE Ansatz | `/vqe/dataset` |
| **Quantum Approximate Optimization** | Combinatorial optimization | Simulated Annealing | QAOA Circuit | `/qaoa/dataset` |

Setiap algoritma memiliki halaman benchmark (klasik vs kuantum) dan halaman dataset visualization.

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm

## Setup

### 1. Backend

```powershell
cd quantum-algo-visualizer
python -m venv venv
.\venv\Scripts\Activate.ps1
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

Backend berjalan di: http://127.0.0.1:5000

### Terminal 2: Frontend

```powershell
cd frontend
npm run dev
```

Frontend berjalan di: http://localhost:5173

**Catatan:** Frontend mem-proxy request API ke backend di port 5000.

## Project Structure

```
quantum-algo-visualizer/
├── backend/
│   ├── app.py                    # Flask entry point
│   ├── config.py                 # Configuration
│   ├── services/                 # Business logic
│   │   ├── vqe_preprocess.py     # VQE canonical generator (FCI + VQE ref)
│   │   ├── vqe_service.py        # VQE benchmark logic
│   │   ├── qaoa_service.py       # QAOA benchmark logic
│   │   └── common.py             # Shared utilities
│   └── api/
│       ├── __init__.py           # Blueprint registration
│       ├── routes/
│       │   ├── dj.py             # DJ endpoints
│       │   ├── qft.py            # QFT endpoints
│       │   ├── vqe.py            # VQE endpoints
│       │   └── qaoa.py           # QAOA endpoints
│       └── shared/
│           └── plotting.py       # MPL → base64 helpers
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── dj/               # DJ components
│   │   │   ├── qft/              # QFT components
│   │   │   ├── vqe/              # VQE components
│   │   │   ├── qaoa/             # QAOA components
│   │   │   └── layout/           # Shared layout components
│   │   ├── pages/
│   │   │   ├── DJCombinedPage.tsx
│   │   │   ├── QFTCombinedPage.tsx
│   │   │   ├── VQECombinedPage.tsx
│   │   │   ├── QAOACombinedPage.tsx
│   │   │   └── ...               # Dataset pages
│   │   ├── hooks/                # React hooks
│   │   ├── services/             # API clients
│   │   ├── types/                # TypeScript types
│   │   └── utils/                # Utilities
│   └── package.json
├── datasets/
│   ├── dj/                       # DJ raw datasets
│   ├── qft/                      # QFT raw datasets
│   ├── vqe/                      # VQE raw + canonical datasets
│   └── qaoa/                     # QAOA raw datasets
├── spec/                         # Specifications & handoffs
└── venv/                         # Python virtual environment
```

## Fitur Utama

### Benchmarking Klasik vs Kuantum

Setiap algoritma memiliki tab **Klasik** dan **Kuantum**:
- **Klasik**: menjalankan algoritma klasik (Brute Force, FFT, FCI, Simulated Annealing)
- **Kuantum**: menjalankan sirkuit kuantum dengan 1024 shots
- **Perbandingan**: metrik waktu eksekusi, akurasi, dan kompleksitas

### Dataset Visualization

Halaman dataset untuk setiap algoritma menampilkan struktur data mentah:
- **DJ**: Oracle truth table topography
- **QFT**: Signal waveform topology
- **VQE**: Molecule → Qubit mapping → FCI landscape → VQE convergence
- **QAOA**: Adjacency matrix + graph visualization

Setiap card dataset dilengkapi tombol **Take Picture** untuk screenshot PNG.

### Animasi 3D

DJ, QFT, dan QAOA dilengkapi dengan animasi 3D interaktif menggunakan React Three Fiber.

## API Endpoints

### Deutsch-Jozsa

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dj/cases` | GET | List DJ cases |
| `/api/dj/dataset/<case_id>` | GET | Dataset for a case |
| `/api/dj/benchmark` | POST | Run quantum vs classical |
| `/api/dj/classic-run` | POST | Run classical brute force |

### QFT

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/qft/cases` | GET | List QFT cases |
| `/api/qft/dataset/<case_id>` | GET | Dataset for a case |
| `/api/qft/benchmark` | POST | Run quantum vs classical |

### VQE

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vqe/cases` | GET | List VQE cases |
| `/api/vqe/dataset/<case_id>` | GET | Dataset (with FCI + VQE reference) |
| `/api/vqe/benchmark` | POST | Run VQE vs FCI |
| `/api/vqe/classical-run` | POST | Run FCI exact diagonalization |

### QAOA

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/qaoa/cases` | GET | List QAOA cases |
| `/api/qaoa/dataset/<case_id>` | GET | Dataset for a case |
| `/api/qaoa/benchmark` | POST | Run QAOA vs SA + exact |

## VQE Pipeline Detail

VQE menggunakan pipeline preprocessing molekul H₂/STO-3G:

1. **AO Integrals** — Gaussian primitive overlap, kinetic, nuclear, ERI
2. **RHF** — Restricted Hartree-Fock self-consistent field
3. **MO Transform** — Transformasi ke basis molecular orbital
4. **Jordan-Wigner Mapping** — Fermion → Qubit via qiskit-nature
5. **Canonical Output** — Hamiltonian Pauli terms + FCI reference + VQE precomputed reference

### VQE Precompute Strategy

- **VQE-01 (2 qubit)**: koefisien well-known dari literatur (O'Malley et al. PRL 2016)
- **VQE-02 (4 qubit)**: dynamic JW mapping dari integrals AO pure-Python
- Canonical JSON menyimpan `classical_reference` (FCI exact) dan `quantum_reference` (VQE convergence history)

## Test Commands

```powershell
# Health check
curl http://127.0.0.1:5000/api/health

# List VQE cases
curl http://127.0.0.1:5000/api/vqe/cases

# Get VQE dataset with FCI reference
curl http://127.0.0.1:5000/api/vqe/dataset/VQE-01

# Run VQE benchmark (quantum vs FCI)
curl -X POST http://127.0.0.1:5000/api/vqe/benchmark -H "Content-Type: application/json" -d "{\"case_id\": \"VQE-01\", \"shots\": 1024}"

# Run FCI classical reference
curl -X POST http://127.0.0.1:5000/api/vqe/classical-run -H "Content-Type: application/json" -d "{\"case_id\": \"VQE-01\"}"
```

## Output Files

Hasil klasik tersimpan di folder `datasets/<algorithm>/results/`:

```
datasets/
├── dj/results/
│   ├── DJ-01_classical.json
│   └── ...
├── vqe/canonical/
│   ├── VQE-01.canonical.json    # Hamiltonian + FCI + VQE ref
│   └── VQE-02.canonical.json
└── qaoa/results/
    └── ...
```

## Dependensi Utama

**Backend:**
- Flask + flask-cors
- qiskit, qiskit-nature, qiskit-algorithms
- numpy, scipy, matplotlib

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS
- React Three Fiber (animasi 3D)
- html2canvas (screenshot)
- lucide-react (icons)

## Lisensi

Project ini dikembangkan untuk keperluan Tugas Akhir.
