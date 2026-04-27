# VQE Dataset Visualization Guide

## 1. Data yang Tersedia

### VQE-01 (Raw)
```json
{
  "case_id": "VQE-01",
  "problem_type": "molecule_ground_state",
  "molecule_spec": {
    "formula": "H2",
    "interatomic_distance_angstrom": 0.735,
    "basis": "sto-3g",
    "charge": 0,
    "multiplicity": 1
  },
  "preprocessing": {
    "mapping": "jordan_wigner",
    "target_qubits": 2
  },
  "experiment": {
    "ansatz_type": "ry_linear",
    "n_layers": 1,
    "shots": 1024,
    "classical_reference": "FCI"
  }
}
```

### VQE-01 (Canonical)
```json
{
  "case_id": "VQE-01",
  "description": "H2 molecule ground state energy - 2 qubit",
  "molecule": "H2",
  "qubits": 2,
  "ansatz": { "type": "ry_linear", "n_layers": 1 },
  "hamiltonian": {
    "terms": {
      "II": -1.0524,
      "ZI": 0.3979,
      "IZ": -0.3979,
      "ZZ": -0.0113,
      "XX": 0.1809,
      "YY": 0.1809
    }
  }
}
```

### VQE-02 (Raw)
```json
{
  "case_id": "VQE-02",
  "problem_type": "molecule_ground_state",
  "molecule_spec": {
    "formula": "H2",
    "interatomic_distance_angstrom": 0.735,
    "basis": "sto-3g",
    "charge": 0,
    "multiplicity": 1
  },
  "preprocessing": {
    "mapping": "jordan_wigner",
    "target_qubits": 4
  },
  "experiment": {
    "ansatz_type": "ry_linear",
    "n_layers": 2,
    "shots": 1024,
    "classical_reference": "FCI"
  }
}
```

### VQE-02 (Canonical)
```json
{
  "case_id": "VQE-02",
  "description": "H2 molecule ground state energy - 4 qubit",
  "molecule": "H2",
  "qubits": 4,
  "ansatz": { "type": "ry_linear", "n_layers": 2 },
  "hamiltonian": {
    "terms": {
      "IIII": 1.3224824848,
      "IIIZ": -0.4377785557,
      "IIZI": -0.4377785557,
      "IIZZ": 0.3983164337,
      "IZII": -0.9387415432,
      "IZIZ": 0.2752861221,
      "IZZI": 0.3938721587,
      "XXYY": -0.1185860366,
      "XYYX": 0.1185860366,
      "YXXY": 0.1185860366,
      "YYXX": -0.1185860366,
      "ZIII": -0.9387415432,
      "ZIIZ": 0.3938721587,
      "ZIZI": 0.2752861221,
      "ZZII": 0.4138937639
    }
  }
}
```

---

## 2. Apa yang Ditampilkan Algoritma Lain?

### DJ (Deutsch-Jozsa)
- **Data:** Oracle function f(x) → 0 atau 1 untuk setiap bitstring input
- **Visual:** Grid kotak dengan nilai 0/1, warna biru untuk 1, putih untuk 0
- **Fingerprint:** Sekali lihat tahu — semua 0 = CONSTANT, setengah 1 = BALANCED

### QFT (Quantum Fourier Transform)
- **Data:** Array sinyal (amplitudo per titik waktu)
- **Visual:** Kurva/gelombang (line chart)
- **Fingerprint:** Bentuk gelombang — repetitif rapi = PERIODIK, tumpang tindih = MIXED

### QAOA (Quantum Approximate Optimization)
- **Data:** Graph (nodes + edges dengan weight)
- **Visual:** Adjacency matrix (grid biru/putih) + diagram graph (node dan edge)
- **Fingerprint:** Struktur konektivitas — K3, K4, path, cycle

### VQE — Apa Fingerprint-nya?
- **Data:** Hamiltonian (daftar Pauli strings dengan koefisien)
- **Yang seharusnya ditampilkan:** **Grid operator** (seperti DJ tapi dengan I/Z/X/Y) + **magnitude bar** (seperti QFT tapi diskrit per term)

---

## 3. Yang HARUS Dibuild untuk VQE

### 3.1 Visualisasi Utama: Hamiltonian Term Matrix

Setiap case (VQE-01, VQE-02) ditampilkan sebagai card. Di dalam card:

```
┌─────────────────────────────────────────────┐
│  ⚛ VQE-01                2 QUBITS           │
│  H₂ Molecule          ry_linear · 1 layer   │
├─────────────────────────────────────────────┤
│                                             │
│  Hamiltonian Terms (6)                      │
│                                             │
│  Coeff      Q₀      Q₁      Magnitude       │
│  ──────────────────────────────────────     │
│  -1.0524   [I]     [I]     ████████████    │
│  +0.3979   [Z]     [I]     ████             │
│  -0.3979   [I]     [Z]     ████             │
│  +0.1809   [X]     [X]     ██               │
│  +0.1809   [Y]     [Y]     ██               │
│  -0.0113   [Z]     [Z]     ▏                │
│                                             │
├─────────────────────────────────────────────┤
│  📊 1 Identity · 3 Z-type · 2 X/Y-type      │
│  🎯 FCI Reference: -1.857 Ha                │
│                                             │
│  H₂ at 0.735 Å, STO-3G basis                │
└─────────────────────────────────────────────┘
```

**Encoding visual:**
- `[I]` = Kotak abu-abu muda, teks abu-abu (identity — tidak aktif)
- `[Z]` = Kotak biru muda, teks biru (operator diagonal)
- `[X]` = Kotak merah muda, teks merah (operator off-diagonal)
- `[Y]` = Kotak hijau muda, teks hijau (operator off-diagonal)
- **Magnitude bar:** Panjang ∝ |koefisien| / |koefisien maks|, warna hijau (+) atau merah (-)

### 3.2 Visualisasi VQE-02 (4 Qubit)

Sama, tapi 4 kolom operator + 15 baris:

```
│  Coeff      Q₀      Q₁      Q₂      Q₃      Magnitude       │
│  -0.4378   [I]     [I]     [I]     [Z]     ████             │
│  -0.4378   [I]     [I]     [Z]     [I]     ████             │
│  -0.9387   [I]     [Z]     [I]     [I]     ████████         │
│  ...                                                         │
│  -0.1186   [X]     [X]     [Y]     [Y]     ██               │
```

**Perhatian:** XXYY terms WAJIB ditampilkan dengan warna X dan Y — ini membedakan JW mapping dari parity mapping (yang tidak punya X/Y).

### 3.3 Statistik Ringkasan

Setiap card punya footer dengan statistik:
- **Total terms:** 6 (VQE-01) atau 15 (VQE-02)
- **By type:** Identity count / Z-only count / X/Y count
- **Dominant term:** Yang punya |coefficient| terbesar
- **FCI energy:** Precomputed dari exact diagonalization

### 3.4 Yang Perlu Ditambah ke Dataset (Data Solusi)

Saat ini canonical JSON **hanya berisi Hamiltonian**. Tidak ada solusi. Bandingkan:
- DJ dataset: oracle pattern = problem, tapi pattern-nya juga langsung tunjukkan classification (constant/balanced)
- QFT dataset: signal array = problem, bentuknya juga langsung tunjukkan jenis (periodic/mixed)
- QAOA dataset: graph = problem, strukturnya juga langsung tunjukkan karakteristik

**VQE perlu precomputed reference values** supaya dataset page "lengkap":

```json
{
  "case_id": "VQE-01",
  "classical_reference": {
    "energy": -1.857,
    "method": "FCI",
    "matrix_size": "4x4"
  }
}
```

**Cara compute:** exact diagonalization dari Hamiltonian matrix (sudah diimplementasikan di `vqe_service.py`, tinggal dipindah ke preprocessing).

---

## 4. Design Specification untuk Frontend

### 4.1 Halaman: `/vqe/dataset`

**Layout:**
- Header: "Hamiltonian Topography" + deskripsi singkat
- Grid: 2 card sejajar (VQE-01 kiri, VQE-02 kanan)
- Tiap card: fixed width, scrollable jika term banyak

### 4.2 Komponen Card

**Header card:**
- Kiri atas: icon molekul (Atom dari lucide-react)
- Tengah: case_id bold besar
- Kanan atas: qubit count badge
- Bawah case_id: molecule formula + ansatz type + layer count

**Body card — Hamiltonian Grid:**
- Table/Grid dengan 3 section per row: Coefficient | Operators | Bar
- Coefficient: monospace, bold, warna by sign (hijau +, merah -)
- Operators: flex row dengan gap, tiap operator adalah kotak berwarna (40×40px untuk 2-qubit, 32×32px untuk 4-qubit)
- Bar: div dengan width percentage, height 8px, border-radius 4px

**Footer card:**
- Flex row dengan gap
- Badge: term count by category
- FCI energy: monospace, highlighted
- Description text: molecule + distance + basis

### 4.3 Warna Operator (Tailwind)

| Operator | Background | Text | Border |
|----------|-----------|------|--------|
| I | bg-slate-100 | text-slate-500 | border-slate-200 |
| Z | bg-blue-100 | text-blue-700 | border-blue-200 |
| X | bg-red-100 | text-red-700 | border-red-200 |
| Y | bg-emerald-100 | text-emerald-700 | border-emerald-200 |

### 4.4 Responsiveness

- Desktop: 2 card side-by-side
- Tablet: 2 card side-by-side (operator boxes shrink)
- Mobile: 1 card stacked (horizontal scroll untuk operator row)

---

## 5. Data Flow untuk Dataset Page

```
User visits /vqe/dataset
    ↓
Frontend fetch GET /api/vqe/cases
    ↓
For each case, display card
    ↓
Card renders from canonical JSON:
    - case_id, qubits, ansatz
    - hamiltonian.terms (sorted by |coeff| desc)
    - classical_reference.energy (if available)
```

**Catatan:** Kalau `classical_reference` belum ada di canonical, bisa:
- (A) Fetch dari backend endpoint `/api/vqe/classical-run/<case_id>` — tapi ini eksekusi FCI, bukan baca dataset
- (B) Precompute saat generate canonical dan simpan di JSON — **ini yang direkomendasikan**

---

## 6. Perbandingan Visual dengan Algoritma Lain

| Aspek | DJ | QFT | QAOA | VQE (rencana) |
|-------|-----|-----|------|---------------|
| **Data utama** | Oracle f(x) | Signal array | Graph edges | Hamiltonian terms |
| **Visual core** | Grid 0/1 | Waveform | Adjacency matrix + graph | Operator grid + bars |
| **Color coding** | Biru/putih | Single line biru | Biru/putih | Multi-warna (I/Z/X/Y) |
| **Fingerprint** | Pattern 0/1 | Wave shape | Connectivity | Operator composition |
| **Classification** | CONSTANT / BALANCED | PERIODIC / MIXED | Graph type (K3, K4) | 2-qubit / 4-qubit |
| **Reference** | Sudah implisit | Sudah implisit | Sudah implisit | Perlu FCI energy badge |

---

## 7. Checklist Implementasi

### Backend
- [ ] Precompute FCI energy saat generate canonical JSON
- [ ] Tambah field `classical_reference` ke canonical output

### Frontend
- [ ] Buat `VQEDatasetVisualizer.tsx`
- [ ] Buat `VQEDatasetPage.tsx`
- [ ] Tambah route `/vqe/dataset` di `App.tsx`
- [ ] Tambah `datasetLink` di `VQECombinedPage.tsx`

### Design
- [ ] Implementasi operator grid dengan color coding
- [ ] Implementasi coefficient magnitude bars
- [ ] Footer statistik (term count, FCI energy)
- [ ] Screenshot/download support (camera icon)

---

## 8. Contoh Render Final (Mockup Teks)

```
┌──────────────────────────────────────────────────────────────────────┐
│                    HAMILTONIAN TOPOGRAPHY                              │
│  Visualisasi operator Pauli untuk molekul H₂ dalam basis STO-3G.      │
│  Setiap baris adalah satu term Hamiltonian dengan koefisiennya.       │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────────────┐
│  ⚛ VQE-01                │  │  ⚛ VQE-02                        │
│  H₂ Molecule             │  │  H₂ Molecule                     │
│  2 QUBITS                │  │  4 QUBITS                        │
│  ry_linear · 1 layer     │  │  ry_linear · 2 layers            │
├──────────────────────────┤  ├──────────────────────────────────┤
│  Coeff    Q₀   Q₁  Bar   │  │  Coeff     Q₀ Q₁ Q₂ Q₃  Bar     │
│  ─────────────────────── │  │  ──────────────────────────────  │
│  -1.0524  I    I   ████  │  │  1.3225    I  I  I  I   ████    │
│  +0.3979  Z    I   █     │  │  -0.4378   I  I  I  Z   █       │
│  -0.3979  I    Z   █     │  │  -0.4378   I  I  Z  I   █       │
│  +0.1809  X    X   ▌     │  │  -0.9387   I  Z  I  I   ██      │
│  +0.1809  Y    Y   ▌     │  │  ...                            │
│  -0.0113  Z    Z   ▏     │  │  -0.1186   X  X  Y  Y   ▌       │
│                          │  │                                 │
├──────────────────────────┤  ├──────────────────────────────────┤
│  📊 6 terms              │  │  📊 15 terms                     │
│  🎯 FCI: -1.857 Ha       │  │  🎯 FCI: -1.847 Ha               │
│  H₂ @ 0.735 Å, STO-3G    │  │  H₂ @ 0.735 Å, STO-3G            │
└──────────────────────────┘  └──────────────────────────────────┘
```

---

*Dokumen ini fokus pada VISUALISASI dataset VQE. Untuk dokumentasi teknis preprocessing dan backend, lihat file ADR di `spec/documentation/`.*
