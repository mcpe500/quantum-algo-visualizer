# RULES TO FOLLOW: Quantum Algorithm Visualizer

## Overview

Quantum algorithm visualization system for Tugas Akhir. Currently implements Deutsch-Jozsa (DJ), Quantum Fourier Transform (QFT), with VQE and QAOA planned. All algorithms follow data-driven architecture with dynamic case discovery from JSON datasets.

## Academic Manuscript Guardrails (TA/Buku)

When writing thesis/book chapters (not internal engineering docs):

1. **Do not write filesystem paths** in narrative text (no `scripts/datasets/...`, no backend/frontend paths).
2. **Do not cite technical filenames** as primary references in body text (no `*.json`, `*.py`, `*.md`, etc.).
3. **Use case-code references** and academic descriptions instead (e.g., `DJ-01`, `QFT-02`, `VQE-01`, `QAOA-02`).
4. File/path details belong to internal dev docs or appendices, not core manuscript narrative.
5. **Exception:** Markdown image tags may keep paths for rendering (`![...](...)`), as long as path strings are not discussed as narrative content.

## Algorithm Status

| Algorithm | Status | Classical Comparator |
|-----------|--------|---------------------|
| Deutsch-Jozsa (DJ) | ✅ Complete | Brute Force |
| Quantum Fourier Transform (QFT) | ✅ Complete | FFT |
| Variational Quantum Eigensolver (VQE) | ✅ Complete | FCI (Exact Diagonalization) |
| Quantum Approximate Optimization Algorithm (QAOA) | ✅ Complete | Simulated Annealing + Brute Force |

## 1. PROJECT STRUCTURE

```
quantum-algo-visualizer/
├── backend/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── dj.py              # Main DJ API endpoints
│   ├── app.py                 # Flask app entry
│   ├── datasets/dj/          # Case JSON files (DJ-01.json, DJ-02.json, etc.)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/DJCombinedPage.tsx
│   │   ├── components/dj/    # DJ visualization components
│   │   ├── services/api.ts
│   │   └── types/dj.ts, classical.ts
│   └── package.json
└── spec/
    └── notes/RULES_TO_FOLLOW.md
```

## 2. DATA MODEL

### Case JSON Format

Located in `datasets/dj/DJ-XX.json`:

```json
{
  "case_id": "DJ-01",
  "n_qubits": 3,
  "expected_classification": "CONSTANT" | "BALANCED",
  "oracle_definition": {
    "truth_table": {
      "000": 0,
      "001": 1,
      "010": 0,
      "011": 1,
      ...
    }
  }
}
```

### API Response Types

**Trace Response** (`GET /api/dj/trace/<case_id>`):
```json
{
  "case_id": "DJ-02",
  "n_qubits": 3,
  "classification": "BALANCED",
  "stages": [
    {
      "step": 1,
      "operation": "X H H",
      "wire_markers": {"0": "H", "1": "H", "2": "H"},
      "ancilla_marker": "X",
      "phase": "init"
    }
    // ... more stages (1 row = 1 circuit column)
  ],
  "partitions": [
    {"stageId": "init", "label": "Inisialisasi", "start": 0, "end": 1},
    {"stageId": "prep", "label": "Persiapan", "start": 1, "end": 2},
    ...
  ],
  "pseudocode": [
    "Algoritma 4.2 Solusi Kuantum Deutsch-Jozsa (DJ-02)",
    "01: BACA N = 3",
    ...
  ]
}
```

**Catatan:**
- Field `pseudocode` dihasilkan oleh backend tetapi **tidak ditampilkan di UI quantumtab saat ini**
-trace table menampilkan `stages` dengan format `wire_markers` langsung

## 3. DYNAMIC BEHAVIOR RULES

### Case Discovery
- All cases discovered automatically from `datasets/dj/*.json`
- Case files must match pattern `DJ-*.json`
- Adding new JSON files works without code changes

### Oracle Construction
Uses `truth_table` to determine:
- **CONSTANT (0)**: Identity oracle (no gates between barriers)
- **CONSTANT (1)**: X gate on ancilla
- **BALANCED**: Multi-controlled X for each input where `f(x) = 1`

### Trace Generation
- **One row = one circuit column**
- Row count scales with `truth_table` complexity:
  - DJ-01 (constant-zero): ~4-6 columns (termasuk measurement per qubit)
  - DJ-02 (balanced, 4 ones): ~(1 init + 1 prep + 12 oracle + 1 interference + 3 measure) = ~18 columns
  - DJ-04 (balanced, 6 ones): lebih banyak lagi

### Trace Symbols
| Symbol | Meaning |
|--------|---------|
| `H` | Hadamard gate |
| `X` | Pauli-X gate |
| `●` | Control qubit (CNOT) - displayed as purple bold |
| `⊕` | Target qubit (ancilla) - displayed as orange bold |
| `M` | Measurement |
| `-` | No operation |

## 4. BACKEND RULES

### Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/dj/benchmark` | Run both quantum + classic |
| GET | `/api/dj/circuit-image/<case_id>` | Circuit PNG |
| GET | `/api/dj/circuit-image-boxed/<case_id>` | Circuit with phase boxes |
| GET | `/api/dj/trace/<case_id>` | Quantum trace table |
| POST | `/api/dj/classic-run` | Classical only |
| GET | `/api/dj/cases` | List available cases |
| GET | `/api/dj/dataset/<case_id>` | Raw case JSON |

### Trace Builder Functions

Located in `backend/api/dj.py`:

1. **`build_trace_by_layer(n_qubits, truth_table)`**
   - Generates trace from circuit structure
   - One row = one visual column
   - Dynamic based on `truth_table`

2. **`_truth_table_profile(truth_table)`**
   - Analyzes truth_table to determine:
     - `is_constant_zero`: all outputs 0
     - `is_constant_one`: all outputs 1
     - `is_balanced`: mixed 0 and 1

3. **`create_dj_circuit(n_qubits, truth_table)`**
   - Builds Qiskit quantum circuit
   - Uses barriers to separate phases:
     - `[init][barrier][oracle][barrier][measure]`

4. **`generate_quantum_pseudocode(case_id, n_qubits, stages)`**
   - Generates quantum pseudocode but not currently displayed in UI

### Phase Detection
Phases automatically detected from trace:
- `init`: Initial gates (X on ancilla, H on inputs)
- `prep`: Hadamard on ancilla
- `oracle`: Oracle gates (computed from `truth_table`)
- `interference`: Final H gates
- `measure`: Measurement gates

## 5. FRONTEND RULES

### Tab Interface
- **Klasik Tab** (`activeTab === 'classic'`): Classical brute-force solution with pseudocode
- **Kuantum Tab** (`activeTab === 'quantum'`): Quantum solution + circuit image + boxed circuit image + trace table + comparison section
- Tab state managed by `activeTab: 'classic' | 'quantum'` in `DJCombinedPage.tsx`

### Component Architecture

| Component | File | Purpose |
|-----------|------|---------|
| `DJCombinedPage.tsx` | `pages/` | Main orchestrator with tab navigation |
| `QuantumVisualization.tsx` | `components/dj/` | Quantum metrics + circuit images |
| `ComparisonSection.tsx` | `components/dj/` | Quantum vs Classic comparison |
| `QuantumTraceTable.tsx` | `components/dj/` | Per-column trace table (no pseudocode) |
| `ClassicalVisualization.tsx` | `components/dj/` | Classical solution display with pseudocode |

### API Service Methods

`frontend/src/services/api.ts`:

```typescript
djApi.getCases()                    // GET /api/dj/cases
djApi.runBenchmark(params)           // POST /api/dj/benchmark
djApi.getCircuitImage(caseId)        // GET /api/dj/circuit-image/{caseId}
djApi.getCircuitImageBoxed(caseId)   // GET /api/dj/circuit-image-boxed/{caseId}
djApi.getQuantumTrace(caseId)      // GET /api/dj/trace/{caseId}
djApi.runClassicalDJ(caseId)       // POST /api/dj/classic-run
```

### State Management
- Daftar case dimuat dari API saat component mount
- Perubahan `selectedCaseId` memicu reload:
  - `classicalResult`
  - `circuitImage` (regular)
  - `boxedCircuitImage`
  - `quantumTrace`
- Tombol `Jalankan` memicu benchmark dan refresh data utama
- Tab switch dikontrol oleh `activeTab` state

### Quantum UI Notes
- `QuantumTraceTable.tsx` hanya menampilkan trace table
- Pseudocode quantum **belum ditampilkan** di UI (meskipun backend mengirim field `pseudocode`)
- `DJCombinedPage.tsx` menggunakan tab `Klasik` dan `Kuantum`

## 6. PHASE BOX VISUALIZATION

Phase boxes drawn on circuit image in backend (`_add_phase_boxes_to_figure`):

| Phase | Color |
|------|-------|
| Inisialisasi (1) | Blue (#3B82F6) |
| Persiapan (2) | Green (#10B981) |
| Oracle (3) | Amber (#F59E0B) |
| Interferensi (4) | Violet (#8B5CF6) |
| Measurement (5) | Red (#EF4444) |

Box widths proportional to instruction count per phase.

## 7. DATA FLOW

```
User selects DJ-02
        ↓
Frontend loads cases from /api/dj/cases
        ↓
User changes case or clicks "Jalankan"
        ↓
Backend loads case, runs quantum + classic
        ↓
Frontend displays both results with tabs
```

## 8. FILES MODIFIED IN ORDER

### Session History

| Session | Spec | Changes |
|--------|------|----------|
| 001 | 001.project-summary.md | Project setup |
| 002 | 002.dj-webapp.md | Basic DJ webapp |
| 003 | 003.dj-layout-fix.md | Layout fixes |
| 004 | 004.dj-quantum-tracing.md | Quantum trace table |
| 005 | 005.dj-remove-hardcode.md | Dynamic case discovery |
| 006 | 006.dj-grouped-quantum-preview.md | Phase boxes on circuit |
| 007 | 007.dj-dynamic-trace.md | Per-column trace + tabs |

### Key Files

| File | Description |
|------|-------------|
| `backend/api/dj.py` | All DJ API logic |
| `frontend/src/pages/DJCombinedPage.tsx` | Main page with tabs |
| `frontend/src/components/dj/QuantumTraceTable.tsx` | Trace table component |
| `frontend/src/services/api.ts` | API client methods |
| `frontend/src/types/dj.ts` | DJ TypeScript types |

## 9. TESTING CHECKLIST

### Manual Tests

1. **Basic Load**
   - [ ] Open DJ page at http://localhost:5173
   - [ ] Case selector shows all discovered cases
   - [ ] Click "Jalankan"

2. **Klasik Tab** (switch to Klasik tab first)
   - [ ] Pseudocode block shows lines
   - [ ] Input → Oracle → Result flow displays
   - [ ] CONSTANT shows blue indicator, BALANCED shows orange

3. **Kuantum Tab** (switch to Kuantum tab)
   - [ ] Circuit image renders (PNG)
   - [ ] Circuit image with phase boxes renders
   - [ ] Phase boxes visible (init, prep, oracle, interference, measure)
   - [ ] Trace table shows correct row count
   - [ ] Row count matches circuit column count
   - [ ] CNOT shows ● (purple) for control, ⊕ (orange) for target
   - [ ] Metrics displayed (depth, gate count, shots)
   - [ ] Measurement counts shown
   - [ ] Comparison section displayed below trace

4. **Case Variations**
   - [ ] DJ-01: constant-zero → short trace
   - [ ] DJ-02: balanced → longer trace
   - [ ] DJ-04: balanced → longest trace

5. **Dynamic Behavior**
   - [ ] Add new DJ-05.json to datasets/dj/
   - [ ] Reload page
   - [ ] New case appears in selector automatically

## 10. IMPORTANT NOTES

### No Hardcoding
- Never hardcode truth_table, case list, or row counts
- Always derive from JSON data
- Always use trace endpoint data in frontend

### Naming Conventions
- Use Indonesian for UI labels (Inisialisasi, Persiapan, Oracle, etc.)
- Use standard notation for circuit symbols (H, X, CNOT, M)
- Use pascal-case for React components

### Matplotlib Rendering Notes
- Backend currently uses plain `matplotlib.use('Agg')` without custom LaTeX/mathtext overrides
- **Do NOT add** `mpl.rcParams['text.usetex']`, `mpl.rcParams['mathtext.default']`, or `mpl.rcParams['text.parse_math']` globally unless absolutely necessary
- Adding mathtext parsing overrides can break Qiskit wire labels (showing `${q}_{0}$` instead of `q0`)
- If wire label issues occur, check Qiskit + matplotlib version compatibility first

### Documentation Consistency
- If backend still sends unused fields, mark as optional in documentation
- RULES_TO_FOLLOW documents actual application behavior, not future plans

### Error Handling
- Return 404 for missing cases
- Return 500 with message for render failures
- Log errors to console for debugging

---

## PART B: QUANTUM FOURIER TRANSFORM (QFT)

## 11. QFT OVERVIEW

Quantum Fourier Transform (QFT) visualization at route `/qft`. Compares classical FFT and quantum QFT using the **same dataset signal**. QFT uses amplitude encoding from the signal before applying the transform circuit.

### Key Concept
- **FFT**: Classical algorithm operating on signal samples directly
- **QFT**: Quantum algorithm encoding signal into qubit amplitudes, then transforming
- **Input Rule**: Signal length must be power of 2; padded if necessary

## 12. QFT DATA MODEL

### Case JSON Format

Located in `datasets/qft/QFT-XX.json`:

```json
{
  "case_id": "QFT-01",
  "description": "Sinyal periodic sederhana",
  "n_points": 28,
  "signal_data": [2.0, 1.414, 0.0, -1.414, ...],
  "signal_type": "synthetic_periodic"
}
```

### CRITICAL RULE: Power of Two Requirement

**QFT requires input length to be power of 2.** This is fundamental to QFT circuit structure.

```
Original signal length: N
If N is NOT power of 2:
  → Pad with zeros to next power of 2: N' = 2^k where 2^(k-1) < N ≤ 2^k
  → Number of qubits: n = log2(N') = k

Examples:
  QFT-01: 28 points → pad to 32 = 2^5 → 5 qubits
  QFT-02: 64 points → 64 = 2^6 → 6 qubits (no padding needed)
```

### Dataset Flow

```
signal_data (from JSON)
    ↓
Check length
    ↓
If not power of 2 → PAD with zeros
    ↓
Normalize → amplitude encoding
    ↓
Apply QFT circuit
```

## 13. QFT BACKEND RULES

### Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/qft/cases` | List available QFT cases |
| GET | `/api/qft/dataset/<case_id>` | Raw case JSON |
| POST | `/api/qft/benchmark` | Run FFT vs QFT benchmark |
| GET | `/api/qft/circuit-image/<case_id>` | QFT core circuit PNG |
| GET | `/api/qft/trace/<case_id>` | QFT trace table |

### Key Functions in `backend/api/qft.py`

1. **`next_power_of_2(n)`**
   - Computes smallest power of 2 ≥ n
   - **CRITICAL**: Used for padding requirement

2. **`pad_signal(signal_data, target_length)`**
   - Pads signal with zeros to reach power-of-2 length
   - Preserves original signal values, appends zeros

3. **`create_qft_circuit(n_qubits)`**
   - Builds conceptual QFT core circuit:
     - Hadamard gates on each qubit
     - Controlled-phase rotations (CP gates)
     - SWAP gates for bit reversal
     - Measurement

4. **`run_fft_full(signal_data)`**
   - Runs classical FFT using `numpy.fft.fft`
   - Returns spectrum, dominant bins, magnitudes
   - **Complexity**: O(N log N) where N = padded length

5. **`run_qft_from_signal(signal_data, shots=1024)`**
   - **Amplitude Encoding**: Normalizes signal to quantum state
   - Uses `Initialize(normalized_amplitudes)` to prepare state
   - Applies QFT core circuit
   - Measures with `AerSimulator`
   - **Complexity**: O(n²) gates where n = number of qubits = log2(N)

### QFT Circuit Structure

```
Input: |0⟩^⊗n
    ↓
Initialize(amplitudes) → Encodes signal into quantum state
    ↓
For each qubit j:
  H(j)
  For k = j+1 to n-1:
    CP(π/2^(k-j)) controlled by k, target j
    ↓
SWAP(0, n-1), SWAP(1, n-2), ... → Bit reversal
    ↓
Measure all qubits
```

### Important Current Limitations

- **Qiskit-only**: Cirq and ProjectQ backends NOT yet implemented
- **No coupling map analysis**: Transpilation per framework pending
- **No formal accuracy metric**: Currently visual comparison only
- **Circuit image/trace**: Shows QFT core only, not full amplitude-encoded circuit

### Complexity Interpretation Rule

**FFT vs QFT complexity uses different variables**:

| Algorithm | Variable | Formula | Meaning |
|-----------|----------|---------|---------|
| FFT | N | O(N log N) | Padded signal length (samples) |
| QFT | n | O(n²) | Number of qubits = log2(N) |

**Example**: QFT-02
- Original: 64 points
- Padded: 64 points (N = 64)
- Qubits: 6 (n = log2(64) = 6)
- FFT: O(64 × 6) = O(384)
- QFT: O(6²) = O(36) gates

**IMPORTANT**: Do NOT interpret simulator runtime as quantum speedup proof.

## 14. QFT TRACE AND CIRCUIT RULES

### Trace Phases

Current QFT trace phases:
- `init`: Initial state |0⟩
- `transform`: H and controlled-phase gates
- `swap`: SWAP gates for bit reversal
- `measure`: Measurement

### Trace Symbols

| Symbol | Meaning |
|--------|---------|
| `\|0⟩` | Initial qubit state |
| `H` | Hadamard gate |
| `●` | Control qubit (CP gate) |
| `P` | Phase target |
| `⇄` | SWAP gate |
| `M` | Measurement |
| `-` | No operation |

### Circuit Image Limitation

Current `circuit-image` endpoint shows **QFT core circuit only** (H, CP, SWAP, M).

It does NOT show the `Initialize(amplitudes)` block that precedes it in actual benchmark.

This is acceptable for conceptual visualization but must be documented.

## 15. QFT FRONTEND RULES

### Route
- `/qft` → `QFTCombinedPage.tsx`

### Tab Interface
- **Klasik Tab**: FFT visualization with signal and spectrum charts
- **Kuantum Tab**: QFT visualization with amplitude and probability charts

### Chart Components (inline in page)

| Component | Data | Purpose |
|-----------|------|---------|
| `SignalChart` | `input_signal` | Shows original signal waveform |
| `SpectrumChart` | `fft.spectrum` | FFT magnitude spectrum (bars) |
| `ProbabilityChart` | `qft.probabilities` | QFT measurement probabilities |

### Classic Tab Content

- Original point count
- Padded point count (**shows power-of-2 padding**)
- FFT time complexity: O(N log N)
- FFT execution time
- Input signal chart
- FFT magnitude spectrum chart
- Dominant frequency bins

### Quantum Tab Content

- Number of qubits (derived from padded length)
- Circuit depth
- Gate count
- Shots (default 1024)
- Input amplitudes chart (normalized signal)
- QFT measurement probability chart
- QFT circuit image
- QFT complexity note: O(n²) gates
- Trace table
- Comparison panel with explanatory notes

### Comparison Notes

Backend returns explanatory text:
- `comparison.note`: Explains both use same signal
- `comparison.speedup_factor`: Text explanation (NOT numeric factor)

UI displays these as informational callouts, not as performance metrics.

---

## PART C: VARIATIONAL QUANTUM EIGENSOLVER (VQE)

## 16. VQE OVERVIEW

Variational Quantum Eigensolver (VQE) for finding ground state energy of molecular systems. Planned for route `/vqe`.

### Key Concept
- **Hybrid algorithm**: Classical optimizer + quantum ansatz
- **Problem**: Find minimum eigenvalue of molecular Hamiltonian
- **Classical Comparator**: Full Configuration Interaction (FCI) - exact but exponentially expensive

### Target System
- H₂ (Hydrogen molecule)
- 2-qubit and 4-qubit implementations

## 17. VQE DATA MODEL

### Planned Case JSON Format

Located in `datasets/vqe/VQE-XX.json`:

```json
{
  "case_id": "VQE-01",
  "description": "H2 molecule ground state - 2 qubit",
  "molecule": "H2",
  "qubits": 2,
  "ansatz": {
    "type": "ry_linear",
    "n_layers": 1
  },
  "hamiltonian": {
    "terms": [
      {"pauli": "II", "coefficient": -1.0524},
      {"pauli": "ZI", "coefficient": 0.3979},
      {"pauli": "IZ", "coefficient": -0.3979},
      {"pauli": "ZZ", "coefficient": -0.0113},
      {"pauli": "XX", "coefficient": 0.1809},
      {"pauli": "YY", "coefficient": 0.1809}
    ]
  },
  "reference_energy": -1.15
}
```

### Ansatz Types

| Type | Structure | Entanglement |
|------|-----------|--------------|
| `ry_linear` | Ry rotations + CNOT chain | Linear: 0→1→2→... |
| `ry_circular` | Ry rotations + CNOT ring | Circular: ring topology |

### Hamiltonian Terms

Each term specifies:
- `pauli`: Pauli string (I, X, Y, Z on each qubit)
- `coefficient`: Weight in Hamiltonian

Example for 2 qubits:
- `II`: Identity term
- `ZI`, `IZ`: Single-qubit Z terms
- `ZZ`, `XX`, `YY`: Two-qubit interaction terms

## 18. VQE BACKEND RULES (Planned)

### Planned Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/vqe/cases` | List available VQE cases |
| GET | `/api/vqe/dataset/<case_id>` | Raw case JSON |
| POST | `/api/vqe/benchmark` | Run FCI vs VQE |
| GET | `/api/vqe/circuit-image/<case_id>` | Ansatz circuit PNG |
| GET | `/api/vqe/trace/<case_id>` | VQE trace table |

### Planned Functions

1. **`build_ansatz(n_qubits, n_layers, entanglement)`**
   - Construct parameterized ansatz circuit
   - Ry rotations + CNOT pattern

2. **`run_fci(hamiltonian)`**
   - Exact diagonalization (classical)
   - Returns ground state energy
   - Serves as accuracy reference

3. **`run_vqe(hamiltonian, ansatz, optimizer, shots)`**
   - Variational loop:
     - Initialize random parameters
     - Repeat until convergence:
       - Execute ansatz with current parameters
       - Measure Pauli terms
       - Compute energy expectation
       - Update parameters via optimizer
   - Returns converged energy

4. **`measure_pauli_term(circuit, term, shots)`**
   - Measures single Pauli string
   - Applies basis rotation if needed:
     - X term: apply H before measure
     - Y term: apply S† then H before measure

### Optimizer Considerations

Planned classical optimizers:
- COBYLA (gradient-free, good for noisy functions)
- SPSA (designed for stochastic functions)

Convergence criteria:
- Energy change < threshold (e.g., 1e-6)
- OR max iterations reached (e.g., 100)

## 19. VQE FRONTEND RULES (Planned)

### Route
- `/vqe` → `VQECombinedPage.tsx` (to be created)

### Tab Interface
- **Klasik Tab**: FCI reference and scaling analysis
- **Kuantum Tab**: VQE ansatz, optimizer loop, convergence plot

### Planned Components

| Component | Content |
|-----------|---------|
| Hamiltonian Panel | Visual representation of Pauli terms |
| Ansatz Circuit | Parameterized circuit diagram |
| Convergence Chart | Energy vs iteration plot |
| Optimizer Trace | Step-by-step parameter updates |

### Key Metrics to Display

- **FCI**: Exact ground state energy
- **VQE**: Converged energy
- **Error**: \|E_VQE - E_FCI\|
- **Iterations**: Number of optimizer steps
- **Circuit depth**: Ansatz depth
- **Shots per evaluation**: 1024

---

## PART D: QUANTUM APPROXIMATE OPTIMIZATION ALGORITHM (QAOA)

## 20. QAOA OVERVIEW

Quantum Approximate Optimization Algorithm (QAOA) for combinatorial optimization problems. Planned for route `/qaoa`.

### Key Concept
- **Problem**: Max-Cut on graphs
- **Approach**: Variational quantum circuit with alternating cost and mixer layers
- **Classical Comparator**: Simulated Annealing (heuristic)

### Target Problems
- Max-Cut on K3 (triangle, 3 nodes)
- Max-Cut on K4 (complete graph, 4 nodes)

## 21. QAOA DATA MODEL

### Planned Case JSON Format

Located in `datasets/qaoa/QAOA-XX.json`:

```json
{
  "case_id": "QAOA-01",
  "description": "Max-Cut pada graph K3 (triangle)",
  "problem": "maxcut",
  "graph": {
    "nodes": 3,
    "edges": [[0,1], [1,2], [0,2]]
  },
  "p_layers": 1,
  "maxcut_solution": 2,
  "shots": 1024
}
```

### Graph Structure

- `nodes`: Number of vertices
- `edges`: List of [i, j] pairs defining connections
- Each edge contributes to cut if endpoints are in different partitions

### Max-Cut Objective

Maximize number of edges crossing the partition:
```
C(z) = Σ_{(i,j)∈E} (1 - z_i * z_j) / 2
where z_i ∈ {+1, -1}
```

## 22. QAOA CIRCUIT STRUCTURE (Planned)

### Hamiltonian Mapping

Cost Hamiltonian (problem-specific):
```
H_C = Σ_{(i,j)∈E} (I - Z_i Z_j) / 2
```

Mixer Hamiltonian (standard):
```
H_M = Σ_i X_i
```

### Ansatz with p Layers

For each layer l = 1 to p:
1. **Cost layer**: e^{-i γ_l H_C}
   - Implemented with RZZ gates
2. **Mixer layer**: e^{-i β_l H_M}
   - Implemented with RX gates

### Full Circuit

```
|0⟩^⊗n → H^⊗n (uniform superposition)
    ↓
For each layer:
  Cost(γ) → RZZ gates
  Mixer(β) → RX gates
    ↓
Measure all qubits
```

## 23. QAOA BACKEND RULES (Planned)

### Planned Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/qaoa/cases` | List available QAOA cases |
| GET | `/api/qaoa/dataset/<case_id>` | Raw case JSON |
| POST | `/api/qaoa/benchmark` | Run SA vs QAOA |
| GET | `/api/qaoa/circuit-image/<case_id>` | QAOA circuit PNG |
| GET | `/api/qaoa/trace/<case_id>` | QAOA trace table |

### Planned Functions

1. **`build_maxcut_hamiltonian(graph)`**
   - Converts graph to Ising Hamiltonian
   - Returns Pauli terms

2. **`build_qaoa_ansatz(n_qubits, p_layers)`**
   - Creates parameterized circuit
   - Parameters: γ[1..p], β[1..p]

3. **`run_simulated_annealing(graph, schedule)`**
   - Classical heuristic benchmark
   - Returns best cut found

4. **`run_qaoa(graph, p_layers, optimizer, shots)`**
   - Variational optimization:
     - Initialize random γ, β
     - Repeat:
       - Execute ansatz
       - Compute expected cut value
       - Update parameters
   - Returns best cut and parameters

5. **`compute_cut_value(bitstring, graph)`**
   - Evaluates Max-Cut objective
   - Used for result validation

### Parameter Optimization

QAOA parameters (γ, β) optimized classically:
- Objective: Maximize expected cut value
- Methods: Grid search (small p) or gradient-based

## 24. QAOA FRONTEND RULES (Planned)

### Route
- `/qaoa` → `QAOACombinedPage.tsx` (to be created)

### Tab Interface
- **Klasik Tab**: Graph visualization + Simulated Annealing results
- **Kuantum Tab**: Hamiltonian mapping + QAOA circuit + optimization trace

### Planned Components

| Component | Content |
|-----------|---------|
| Graph Visualization | Nodes and edges of Max-Cut problem |
| Hamiltonian Panel | Ising formulation display |
| Layer Visualization | Cost and mixer layer breakdown |
| Parameter Evolution | γ and β optimization trajectory |
| Cut Quality Chart | Cut value vs iteration |

### Key Metrics to Display

- **Graph**: Nodes, edges
- **Optimal cut**: Known exact solution (for small graphs)
- **SA result**: Cut value from simulated annealing
- **QAOA result**: Best cut from quantum approach
- **Approximation ratio**: QAOA_cut / Optimal_cut
- **Parameters**: Optimized γ, β values

---

## PART E: CROSS-CUTTING RULES

## 25. UNIVERSAL DATA-DRIVEN ARCHITECTURE

All algorithms follow same pattern:

### Case Discovery
- Scan `datasets/<algo>/*.json`
- Sort by case number
- Load dynamically without code changes

### Backend Pattern
- `load_case(case_id)`: Load single JSON
- `get_all_cases()`: List all available
- `run_classical(...)`: Classical benchmark
- `run_quantum(...)`: Quantum simulation
- `create_*_circuit(...)`: Build circuit
- `build_*_trace(...)`: Generate trace table

### Frontend Pattern
- Tab interface: Klasik / Kuantum
- Case selector dropdown
- Run button triggers benchmark
- Download PNG button
- Dynamic circuit image loading
- Trace table display

## 26. QISKIT-FIRST IMPLEMENTATION NOTE

**Current Status**: All implemented algorithms use Qiskit only.

**Planned**: Cirq and ProjectQ backends for fair comparison.

**Implication**: 
- Circuit depth and gate counts currently Qiskit-specific
- Coupling map analysis not yet available
- Transpilation differences not yet exposed

Update RULES when multi-framework support is added.

## 27. SHOTS CONSISTENCY

All quantum algorithms use **1024 shots** by default:
- DJ: 1024 shots for oracle measurement
- QFT: 1024 shots for amplitude transform
- VQE: 1024 shots per energy evaluation
- QAOA: 1024 shots per cut evaluation

This ensures fair comparison and matches proposal specification.

## 28. METRIC INTERPRETATION RULES

### Time Complexity
- Always specify what variable scales
- Never compare across different variable domains without conversion

### Simulator Runtime
- **NEVER interpret as quantum speedup**
- Classical simulator overhead dominates
- Useful for relative comparison only

### Accuracy
- Compare against known exact solution (when available)
- Or against classical gold standard (FCI, exact Max-Cut)

## 29. FILE NAMING CONVENTIONS

### Backend
- `backend/api/<algo>.py`: Algorithm-specific API
- Pattern: `dj.py`, `qft.py`, `vqe.py`, `qaoa.py`

### Frontend
- `frontend/src/pages/<Algo>CombinedPage.tsx`: Main page
- `frontend/src/types/<algo>.ts`: TypeScript types
- Pattern: `DJCombinedPage.tsx`, `QFTCombinedPage.tsx`, etc.

### Datasets
- `datasets/<algo>/<ALGO>-XX.json`
- Pattern: `DJ-01.json`, `QFT-01.json`, etc.
- XX must be zero-padded number (01, 02, not 1, 2)

## 30. DOCUMENTATION UPDATE POLICY

**RULE**: RULES_TO_FOLLOW.md documents **actual behavior**, not future plans.

- Mark planned features clearly ("Planned", "To be implemented")
- Remove "Planned" markers once implemented
- Add version/date notes when behavior changes
- Keep mismatch between code and docs minimal

---

**Last Updated**: 2026-04-14
**Algorithms Documented**: DJ (complete), QFT (complete), VQE (complete), QAOA (complete)
