"""Regenerate VQE raw and canonical datasets from one deterministic script.

Run from project root:
    ./venv/Scripts/python.exe scripts/regenerate_vqe_datasets.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = PROJECT_ROOT / "backend"
DATASET_DIR = PROJECT_ROOT / "datasets" / "vqe"
CANONICAL_DIR = DATASET_DIR / "canonical"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.vqe_preprocess import preprocess_raw_to_canonical  # noqa: E402

RAW_CASES = [
    {
        "case_id": "VQE-01",
        "problem_type": "molecule_ground_state",
        "molecule_spec": {
            "formula": "H2",
            "interatomic_distance_angstrom": 0.735,
            "basis": "sto-3g",
            "charge": 0,
            "multiplicity": 1,
        },
        "preprocessing": {
            "mapping": "jordan_wigner",
            "initial_qubits": 4,
            "qubit_reduction": "z2_tapering",
            "target_qubits": 2,
            "hamiltonian_format": "pauli_sum",
        },
        "experiment": {
            "algorithm": "VQE",
            "ansatz_type": "ry_linear",
            "ansatz_family": "hardware_efficient",
            "rotation_gate": "ry",
            "entanglement": "linear_cnot",
            "n_layers": 1,
            "shots": 1024,
            "optimizer": "COBYLA",
            "classical_reference": "FCI",
        },
    },
    {
        "case_id": "VQE-02",
        "problem_type": "molecule_ground_state",
        "molecule_spec": {
            "formula": "H2",
            "interatomic_distance_angstrom": 0.735,
            "basis": "sto-3g",
            "charge": 0,
            "multiplicity": 1,
        },
        "preprocessing": {
            "mapping": "jordan_wigner",
            "initial_qubits": 4,
            "qubit_reduction": "none",
            "target_qubits": 4,
            "hamiltonian_format": "pauli_sum",
        },
        "experiment": {
            "algorithm": "VQE",
            "ansatz_type": "ry_linear",
            "ansatz_family": "hardware_efficient",
            "rotation_gate": "ry",
            "entanglement": "linear_cnot",
            "n_layers": 2,
            "shots": 1024,
            "optimizer": "COBYLA",
            "classical_reference": "FCI",
        },
    },
]


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    for raw in RAW_CASES:
        case_id = raw["case_id"]
        raw_path = DATASET_DIR / f"{case_id}.json"
        canonical_path = CANONICAL_DIR / f"{case_id}.canonical.json"

        write_json(raw_path, raw)
        canonical = preprocess_raw_to_canonical(raw)
        write_json(canonical_path, canonical)

        terms = len(canonical.get("hamiltonian", {}).get("terms", {}))
        qubits = canonical.get("qubits")
        print(f"{case_id}: wrote raw + canonical ({qubits} qubits, {terms} Pauli terms)")


if __name__ == "__main__":
    main()
