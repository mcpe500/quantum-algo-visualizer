import os
import json
import time
import io
import base64
from datetime import datetime
from flask import jsonify, request

import matplotlib
matplotlib.use('Agg')

import numpy as np
from scipy.optimize import minimize

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp, Statevector
from qiskit.visualization import circuit_drawer
import matplotlib.pyplot as plt

from api import api_bp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'vqe')


def load_case(case_id):
    """Load a VQE case from local dataset JSON file."""
    file_path = os.path.join(DATASETS_DIR, f'{case_id}.json')
    if not os.path.exists(file_path):
        return None
    with open(file_path, 'r') as f:
        return json.load(f)


def _case_sort_key(case):
    case_id = case.get('case_id', '')
    try:
        return (0, int(case_id.split('-', 1)[1]))
    except (IndexError, ValueError, TypeError):
        return (1, case_id)


def get_all_cases():
    """Load all available VQE cases from datasets/vqe/VQE-*.json."""
    cases = []
    if not os.path.isdir(DATASETS_DIR):
        return cases

    for fname in sorted(os.listdir(DATASETS_DIR)):
        file_path = os.path.join(DATASETS_DIR, fname)
        if not os.path.isfile(file_path):
            continue
        case_id, ext = os.path.splitext(fname)
        if ext.lower() != '.json':
            continue
        if not case_id.startswith('VQE-') or not case_id[4:].isdigit():
            continue
        case = load_case(case_id)
        if case:
            cases.append(case)

    cases.sort(key=_case_sort_key)
    return cases


def build_hamiltonian_op(hamiltonian_terms):
    """
    Build SparsePauliOp from a dict of {pauli_string: coefficient}.
    Uses Qiskit convention (rightmost char = qubit 0).
    """
    pauli_list = [(pauli_str, float(coeff)) for pauli_str, coeff in hamiltonian_terms.items()]
    return SparsePauliOp.from_list(pauli_list)


def build_ansatz_no_measure(n_qubits, ansatz_type, n_layers):
    """
    Build ParameterVector-based ansatz WITHOUT measurement for statevector computation.

    Ansatz types:
      - ry_linear:   Ry on each qubit, then CNOT chain (0->1, 1->2, ...)
      - ry_circular: Ry on each qubit, then CNOT ring  (0->1, 1->2, ..., n-1->0)

    Returns (qc, pv) where pv is ParameterVector('theta', n_qubits * n_layers).
    """
    n_params = n_qubits * n_layers
    pv = ParameterVector('\u03b8', n_params)
    qc = QuantumCircuit(n_qubits)

    for layer in range(n_layers):
        # Ry rotation on every qubit
        for i in range(n_qubits):
            qc.ry(pv[layer * n_qubits + i], i)

        # Entanglement layer
        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                qc.cx(i, i + 1)
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                qc.cx(i, (i + 1) % n_qubits)

    return qc, pv


def build_ansatz_circuit(n_qubits, ansatz_type, n_layers):
    """
    Build ParameterVector-based ansatz WITH measurement and classical register.
    Used for circuit image rendering and depth/gate_count reporting.

    Returns (qc, pv).
    """
    n_params = n_qubits * n_layers
    pv = ParameterVector('\u03b8', n_params)
    qr = QuantumRegister(n_qubits, 'q')
    cr = ClassicalRegister(n_qubits, 'c')
    qc = QuantumCircuit(qr, cr)

    for layer in range(n_layers):
        for i in range(n_qubits):
            qc.ry(pv[layer * n_qubits + i], qr[i])

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                qc.cx(qr[i], qr[i + 1])
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                qc.cx(qr[i], qr[(i + 1) % n_qubits])

    qc.measure(qr, cr)
    return qc, pv


def run_vqe_internal(H_op, n_qubits, ansatz_type, n_layers, max_iter=150):
    """
    Run VQE optimization via statevector simulation.

    - Uses Statevector(qc_bound) + sv.expectation_value(H_op) for energy evaluation.
    - Optimizes with COBYLA (scipy).
    - Tracks full energy_history across every function evaluation.

    Returns dict: {energy, convergence_history, optimal_parameters,
                   iterations, circuit_depth, gate_count}
    """
    n_params = n_qubits * n_layers
    qc, pv = build_ansatz_no_measure(n_qubits, ansatz_type, n_layers)

    energy_history = []

    def energy_fn(params):
        param_dict = {pv[i]: float(params[i]) for i in range(n_params)}
        qc_bound = qc.assign_parameters(param_dict)
        sv = Statevector(qc_bound)
        energy = float(sv.expectation_value(H_op).real)
        energy_history.append(energy)
        return energy

    np.random.seed(42)
    x0 = np.random.uniform(0, np.pi, n_params)

    result = minimize(
        energy_fn,
        x0,
        method='COBYLA',
        options={'maxiter': max_iter, 'rhobeg': 0.5}
    )

    # Bind final parameters to get circuit metrics
    final_param_dict = {pv[i]: float(result.x[i]) for i in range(n_params)}
    qc_final = qc.assign_parameters(final_param_dict)
    circuit_depth = int(qc_final.depth())
    gate_count = int(len(qc_final.data))

    return {
        'energy': float(result.fun),
        'convergence_history': [float(e) for e in energy_history[:200]],
        'optimal_parameters': [float(p) for p in result.x],
        'iterations': int(result.nfev),
        'circuit_depth': circuit_depth,
        'gate_count': gate_count,
    }


def build_ansatz_trace(n_qubits, ansatz_type, n_layers):
    """
    Build step-by-step trace table for the VQE ansatz circuit.

    Phases:       'init', 'rotation', 'entanglement', 'measure'
    Wire markers: '|0⟩', 'Ry', '●', '⊕', 'M', '-'

    Returns a list of stage dicts compatible with the frontend trace viewer.
    """
    stages = []
    step_num = 0

    def append_stage(operation, wire_markers, phase_label):
        nonlocal step_num
        step_num += 1
        stages.append({
            'step': step_num,
            'operation': operation,
            'wire_markers': {i: wire_markers.get(i, '-') for i in range(n_qubits)},
            'phase': phase_label,
        })

    # Initialisation ─ all qubits in |0⟩
    init_markers = {i: '|0\u27e9' for i in range(n_qubits)}
    append_stage('Initialize', init_markers, 'init')

    for layer in range(n_layers):
        layer_label = f'layer {layer + 1}'

        # Rotation stage ─ one Ry per qubit
        for i in range(n_qubits):
            rot_markers = {j: '-' for j in range(n_qubits)}
            rot_markers[i] = 'Ry'
            append_stage(f'Ry on q{i} ({layer_label})', rot_markers, 'rotation')

        # Entanglement stage ─ CNOT chain or ring
        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                ent_markers = {j: '-' for j in range(n_qubits)}
                ent_markers[i] = '\u25cf'        # ●
                ent_markers[i + 1] = '\u2295'    # ⊕
                append_stage(
                    f'CNOT q{i}\u2192q{i + 1} ({layer_label})',
                    ent_markers, 'entanglement'
                )
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                tgt = (i + 1) % n_qubits
                ent_markers = {j: '-' for j in range(n_qubits)}
                ent_markers[i] = '\u25cf'
                ent_markers[tgt] = '\u2295'
                append_stage(
                    f'CNOT q{i}\u2192q{tgt} ({layer_label})',
                    ent_markers, 'entanglement'
                )

    # Measurement stage ─ one qubit at a time
    for i in range(n_qubits):
        meas_markers = {j: '-' for j in range(n_qubits)}
        meas_markers[i] = 'M'
        append_stage(f'Measure q{i}', meas_markers, 'measure')

    return stages


def _build_partitions(stages):
    """
    Group consecutive stages that share the same phase into partition blocks.
    Returns a list of {stageId, label, start, end} dicts.
    """
    partitions = []
    current_phase = None
    start_idx = 0

    for i, stage in enumerate(stages):
        if stage['phase'] != current_phase:
            if current_phase is not None:
                partitions.append({
                    'stageId': current_phase,
                    'label': current_phase.capitalize(),
                    'start': start_idx,
                    'end': i,
                })
            current_phase = stage['phase']
            start_idx = i

    if current_phase is not None:
        partitions.append({
            'stageId': current_phase,
            'label': current_phase.capitalize(),
            'start': start_idx,
            'end': len(stages),
        })

    return partitions


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@api_bp.route('/vqe/cases', methods=['GET'])
def vqe_cases():
    """
    GET /api/vqe/cases
    Returns list of all available VQE cases.
    """
    cases = get_all_cases()
    return jsonify({'cases': cases, 'count': len(cases)})


@api_bp.route('/vqe/dataset/<case_id>', methods=['GET'])
def vqe_dataset(case_id):
    """
    GET /api/vqe/dataset/<case_id>
    Returns the raw JSON dataset for a specific case.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)


@api_bp.route('/vqe/benchmark', methods=['POST'])
def vqe_benchmark():
    """
    POST /api/vqe/benchmark
    Body: { "case_id": str, "shots": int }

    Runs FCI (exact diagonalisation) and VQE, returns full comparison.
    """
    data = request.get_json() or {}
    case_id = data.get('case_id', 'VQE-01')
    shots = int(data.get('shots', 1024))

    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = int(case['qubits'])
    ansatz_type = case['ansatz']['type']
    n_layers = int(case['ansatz']['n_layers'])
    hamiltonian_terms = case['hamiltonian']['terms']

    H_op = build_hamiltonian_op(hamiltonian_terms)

    # ── Classical: FCI exact diagonalisation ──────────────────────────────
    t0 = time.perf_counter()
    H_matrix = H_op.to_matrix()
    eigenvalues = np.linalg.eigvalsh(H_matrix)
    fci_energy = float(eigenvalues[0])
    fci_time_ms = (time.perf_counter() - t0) * 1000.0
    dim = int(H_matrix.shape[0])

    # ── Quantum: VQE optimisation ─────────────────────────────────────────
    t1 = time.perf_counter()
    vqe_result = run_vqe_internal(H_op, n_qubits, ansatz_type, n_layers, max_iter=150)
    vqe_time_ms = (time.perf_counter() - t1) * 1000.0

    vqe_energy = float(vqe_result['energy'])
    energy_error = abs(vqe_energy - fci_energy)
    denom = max(abs(fci_energy), 1e-10)
    accuracy = max(0.0, min(100.0, (1.0 - energy_error / denom) * 100.0))

    n_params = n_qubits * n_layers

    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'case_id': case_id,
        'molecule': case.get('molecule', 'Unknown'),
        'description': case.get('description', ''),
        'n_qubits': n_qubits,
        'shots': shots,
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'hamiltonian_terms': hamiltonian_terms,
        'classical': {
            'method': 'FCI (Exact Diagonalization)',
            'energy': fci_energy,
            'execution_time_ms': round(fci_time_ms, 4),
            'time_complexity': f'O({dim}\u00b3)',
            'matrix_size': f'{dim}\u00d7{dim}',
            'note': (
                'Full Configuration Interaction \u2013 exact numerical '
                'diagonalisation of the Hamiltonian matrix'
            ),
        },
        'quantum': {
            'method': 'VQE (Variational Quantum Eigensolver)',
            'energy': vqe_energy,
            'iterations': vqe_result['iterations'],
            'circuit_depth': vqe_result['circuit_depth'],
            'gate_count': vqe_result['gate_count'],
            'time_complexity': f'O({n_params} \u00b7 iter)',
            'convergence_history': vqe_result['convergence_history'],
            'optimal_parameters': vqe_result['optimal_parameters'],
            'execution_time_ms': round(vqe_time_ms, 4),
            'energy_error': float(energy_error),
            'accuracy': round(float(accuracy), 4),
        },
        'comparison': {
            'fci_energy': fci_energy,
            'vqe_energy': vqe_energy,
            'energy_error': float(energy_error),
            'accuracy_percent': round(float(accuracy), 4),
            'note': (
                f'VQE achieved {accuracy:.2f}% accuracy '
                f'compared to the exact FCI result'
            ),
        },
    })


@api_bp.route('/vqe/circuit-image/<case_id>', methods=['GET'])
def vqe_circuit_image(case_id):
    """
    GET /api/vqe/circuit-image/<case_id>
    Returns the ansatz circuit rendered as a base-64 PNG image.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = int(case['qubits'])
    ansatz_type = case['ansatz']['type']
    n_layers = int(case['ansatz']['n_layers'])

    qc, _ = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)

    try:
        fig = circuit_drawer(qc, output='mpl')
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor='white')
        buf.seek(0)
        img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)

        return jsonify({
            'case_id': case_id,
            'n_qubits': n_qubits,
            'ansatz_type': ansatz_type,
            'n_layers': n_layers,
            'image': img_b64,
            'depth': int(qc.depth()),
            'gate_count': int(len(qc.data)),
        })
    except Exception as exc:
        return jsonify({'error': f'Failed to generate circuit image: {exc}'}), 500


@api_bp.route('/vqe/trace/<case_id>', methods=['GET'])
def vqe_trace(case_id):
    """
    GET /api/vqe/trace/<case_id>
    Returns the step-by-step trace table for the VQE ansatz circuit.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = int(case['qubits'])
    ansatz_type = case['ansatz']['type']
    n_layers = int(case['ansatz']['n_layers'])

    stages = build_ansatz_trace(n_qubits, ansatz_type, n_layers)
    partitions = _build_partitions(stages)

    return jsonify({
        'case_id': case_id,
        'n_qubits': n_qubits,
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'stages': stages,
        'partitions': partitions,
    })
