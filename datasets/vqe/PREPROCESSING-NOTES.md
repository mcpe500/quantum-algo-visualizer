# Catatan Preprocessing Dataset VQE

## Lokasi File

- **Raw dataset:** `datasets/vqe/VQE-01.json`, `datasets/vqe/VQE-02.json`
- **Canonical output:** `datasets/vqe/canonical/VQE-01.canonical.json`, `datasets/vqe/canonical/VQE-02.canonical.json`
- **Preprocessing script:** `backend/services/vqe_preprocess.py`
- **Dokumentasi keputusan:** `spec/documentation/vqe-preprocessing-decisions.md`
- **Dokumentasi teknis:** `spec/documentation/vqe-pipeline-technical-spec.md`

---

## Format Raw JSON

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

**Validasi yang dilakukan oleh preprocessing script:**
- `formula` harus `"H2"`
- `basis` harus `"sto-3g"`
- `mapping` harus `"jordan_wigner"`
- `target_qubits` harus `2` atau `4`

---

## Format Canonical JSON

```json
{
  "case_id": "VQE-01",
  "description": "H2 molecule ground state energy - 2 qubit",
  "molecule": "H2",
  "qubits": 2,
  "ansatz": {
    "type": "ry_linear",
    "n_layers": 1
  },
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

---

## Cara Generate Canonical

### Otomatis (via Backend)

Backend akan otomatis generate canonical saat pertama kali case di-request:

1. Baca raw JSON dari `datasets/vqe/{case_id}.json`
2. Jalankan `vqe_preprocess.preprocess_raw_to_canonical(raw_data)`
3. Simpan hasil ke `datasets/vqe/canonical/{case_id}.canonical.json`
4. Return canonical ke frontend

### Manual (via Script)

```bash
cd quantum-algo-visualizer
venv\Scripts\python.exe -c "
import json
from backend.services.vqe_preprocess import preprocess_raw_to_canonical

with open('datasets/vqe/VQE-01.json') as f:
    raw = json.load(f)
canonical = preprocess_raw_to_canonical(raw)

with open('datasets/vqe/canonical/VQE-01.canonical.json', 'w') as f:
    json.dump(canonical, f, indent=2)
print('Generated VQE-01.canonical.json')
"
```

---

## Status per Case

### VQE-01 (2 Qubit)

| Aspek | Status |
|-------|--------|
| Raw JSON | Updated |
| Canonical JSON | Menunggu generate |
| Pipeline | Precomputed lookup table |
| Keterangan | Koefisien well-known dari literatur. Sudah diverifikasi di O'Malley 2016, Kandala 2017, Qiskit Textbook. |

### VQE-02 (4 Qubit)

| Aspek | Status |
|-------|--------|
| Raw JSON | Updated (ansatz diubah dari `ry_circular` ke `ry_linear`) |
| Canonical JSON | Menunggu generate |
| Pipeline | Dynamic JW mapping via qiskit-nature |
| Keterangan | 15 terms dari Jordan-Wigner. Berbeda dari data lama (16 all-Z terms) karena representasi yang benar untuk full 4-spin-orbital space wajib memiliki XXYY terms. |

---

## Perubahan Data VQE-02

**Data lama:**
```json
{
  "ansatz": { "type": "ry_circular", "n_layers": 2 },
  "hamiltonian": {
    "terms": {
      "IIII": -0.097, "IIIZ": 0.071, "IIZI": -0.071,
      ...
      "ZZZZ": 0.048
    }
  }
}
```

**Data baru (canonical):**
```json
{
  "ansatz": { "type": "ry_linear", "n_layers": 2 },
  "hamiltonian": {
    "terms": {
      "IIII": 1.3225, "IIIZ": -0.4378, "IIZI": -0.4378,
      ...
      "YYXX": -0.1186
    }
  }
}
```

**Perbedaan utama:**
1. Ansatz berubah dari `ry_circular` ke `ry_linear` (sesuai proposal)
2. Hamiltonian berubah dari 16 all-Z terms ke 15 terms dengan XXYY
3. Kedua representasi adalah ekuivalen unitary — mereka menggambarkan Hamiltonian fisik yang sama dalam basis qubit yang berbeda

---

## Dependensi untuk Preprocessing

```
numpy
scipy
qiskit-nature
qiskit-algorithms
h5py
```

Semua sudah terinstall di venv dan tercatat di `backend/requirements.txt`.

---

## Troubleshooting

### Error: "Only H2 supported"

Preprocessing script hanya mendukung H2. Kalau ingin molekul lain, perlu:
1. Implementasi integral AO untuk molekul baru
2. Atau generate di Google Colab dengan PySCF dan copy hasilnya

### Error: "Z2 symmetries not found"

Ini terjadi saat mencoba tapering manual. Sudah diketahui dan dihandle dengan menggunakan precomputed coefficients untuk 2-qubit.

### Hasil 4-qubit memiliki XXYY terms

Ini **benar** dan **wajib**. Jangan dianggap bug. Exchange integral menghasilkan XXYY terms dalam JW mapping.

---

## Referensi Cepat

- **Proposal VQE constraint:** `proposal.md` baris 353-365
- **Dataset VQE di bab4:** `bab4/bab4-ver3.md`
- **Diskusi dataset:** `discussion/08-VQE-DATASET-ITU-APA.md`, `discussion/09-VQE-DATASET-DOSEN-FRIENDLY.md`
