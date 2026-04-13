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
from qiskit_aer import AerSimulator
from qiskit.quantum_info import SparsePauliOp, Statevector
from qiskit.visualization import circuit_drawer
import matplotlib.pyplot as plt

from api import api_bp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'qaoa')


# ---------------------------------------------------------------------------
# Dataset helpers
# ---------------------------------------------------------------------------

def load_case(case_id):
    """Load a QAOA case from local dataset JSON file."""
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
    """Load all available QAOA cases from datasets/qaoa/QAOA-*.json."""
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
        if not case_id.startswith('QAOA-') or not case_id[5:].isdigit():
            continue
        case = load_case(case_id)
        if case:
            cases.append(case)

    cases.sort(key=_case_sort_key)
    return cases


# ---------------------------------------------------------------------------
# Hamiltonian construction
# ---------------------------------------------------------------------------

def build_zz_pauli_string(n_nodes, qi, qj):
    """
    Build Pauli string for Z_qi Z_qj in Qiskit convention
    (rightmost character = qubit 0).

    chars[n_nodes - 1 - qi] = 'Z'
    chars[n_nodes - 1 - qj] = 'Z'
    """
    chars = ['I'] * n_nodes
    chars[n_nodes - 1 - qi] = 'Z'
    chars[n_nodes - 1 - qj] = 'Z'
    return ''.join(chars)


def build_cost_hamiltonian_op(n_nodes, edges):
    """
    Build the Max-Cut cost Hamiltonian as a SparsePauliOp:

        H_C = sum_{(i,j) in E}  (I - Z_i Z_j) / 2

    Each edge contributes +0.5 * I  and  -0.5 * Z_i Z_j.
    The resulting operator is simplified (like terms merged).
    """
    identity_str = 'I' * n_nodes
    terms = []
    for (qi, qj) in edges:
        terms.append((identity_str, 0.5))
        zz_str = build_zz_pauli_string(n_nodes, qi, qj)
        terms.append((zz_str, -0.5))
    return SparsePauliOp.from_list(terms).simplify()


# ---------------------------------------------------------------------------
# QAOA circuit builders
# ---------------------------------------------------------------------------

def build_qaoa_circuit_bound(n_nodes, edges, p_layers, gamma, beta):
    """
    Build a fully bound QAOA circuit WITH measurement.

    Circuit structure per layer l:
      Cost unitary  – for each edge (i,j): CNOT(i,j), RZ(2*gamma[l], j), CNOT(i,j)
      Mixer unitary – RX(2*beta[l]) on every qubit

    Args:
        gamma: list/array of length p_layers
        beta:  list/array of length p_layers
    """
    qr = QuantumRegister(n_nodes, 'q')
    cr = ClassicalRegister(n_nodes, 'c')
    qc = QuantumCircuit(qr, cr)

    # Initial superposition
    for i in range(n_nodes):
        qc.h(qr[i])

    for l in range(p_layers):
        g = float(gamma[l])
        b = float(beta[l])

        # Cost unitary: e^{-i*gamma*Z_i*Z_j} via CNOT sandwich
        for (qi, qj) in edges:
            qc.cx(qr[qi], qr[qj])
            qc.rz(2.0 * g, qr[qj])
            qc.cx(qr[qi], qr[qj])

        # Mixer unitary: e^{-i*beta*X} = RX(2*beta)
        for i in range(n_nodes):
            qc.rx(2.0 * b, qr[i])

    qc.measure(qr, cr)
    return qc


def build_qaoa_circuit_no_measure(n_nodes, edges, p_layers, gamma, beta):
    """
    Build a fully bound QAOA circuit WITHOUT measurement.
    Used for statevector-based expectation value computation.

    Args:
        gamma: list/array of length p_layers
        beta:  list/array of length p_layers
    """
    qc = QuantumCircuit(n_nodes)

    # Initial superposition
    for i in range(n_nodes):
        qc.h(i)

    for l in range(p_layers):
        g = float(gamma[l])
        b = float(beta[l])

        # Cost unitary
        for (qi, qj) in edges:
            qc.cx(qi, qj)
            qc.rz(2.0 * g, qj)
            qc.cx(qi, qj)

        # Mixer unitary
        for i in range(n_nodes):
            qc.rx(2.0 * b, i)

    return qc


# ---------------------------------------------------------------------------
# Classical and quantum solvers
# ---------------------------------------------------------------------------

def compute_expected_cut_sv(params, n_nodes, edges, p_layers, H_cost):
    """
    Compute <psi(gamma,beta)| H_cost |psi(gamma,beta)> via Statevector simulation.

    params layout: [gamma_0, ..., gamma_{p-1}, beta_0, ..., beta_{p-1}]
    Returns a float (the expected number of cut edges).
    """
    gamma = params[:p_layers]
    beta = params[p_layers:]
    qc = build_qaoa_circuit_no_measure(n_nodes, edges, p_layers, gamma, beta)
    sv = Statevector(qc)
    return float(sv.expectation_value(H_cost).real)


def compute_cut_from_bitstring(bitstring, edges, n_nodes):
    """
    Compute the cut value for a given bitstring under Qiskit's convention
    (rightmost character = qubit 0).

    bits[i] = int(bitstring[n_nodes - 1 - i])
    """
    bits = [int(bitstring[n_nodes - 1 - i]) for i in range(n_nodes)]
    return sum(1 for (qi, qj) in edges if bits[qi] != bits[qj])


def compute_exact_maxcut(n_nodes, edges):
    """
    Brute-force Max-Cut: enumerate all 2^n_nodes bit assignments.

    Returns (max_cut: int, best_partition: list[int]).
    """
    max_cut = 0
    best_partition = [0] * n_nodes

    for mask in range(1 << n_nodes):
        bits = [(mask >> i) & 1 for i in range(n_nodes)]
        cut = sum(1 for (qi, qj) in edges if bits[qi] != bits[qj])
        if cut > max_cut:
            max_cut = cut
            best_partition = bits[:]

    return int(max_cut), [int(b) for b in best_partition]


def run_simulated_annealing(n_nodes, edges, n_iter=500):
    """
    Simulated Annealing heuristic for Max-Cut.

    Parameters:
        T_start = 2.0, T_decay = 0.99 (geometric cooling)
        np.random.seed(42)

    Returns:
        (best_cut: int,
         best_partition: list[int],
         cut_history: list[int])   # downsampled to ~100 points
    """
    np.random.seed(42)

    current = [int(x) for x in np.random.randint(0, 2, n_nodes)]

    def cut_value(partition):
        return sum(1 for (qi, qj) in edges if partition[qi] != partition[qj])

    current_cut = cut_value(current)
    best_cut = current_cut
    best_partition = current[:]

    T = 2.0
    T_decay = 0.99
    cut_history = []

    for _ in range(n_iter):
        idx = int(np.random.randint(0, n_nodes))
        neighbour = current[:]
        neighbour[idx] = 1 - neighbour[idx]
        new_cut = cut_value(neighbour)

        delta = new_cut - current_cut
        if delta > 0 or np.random.rand() < np.exp(delta / T):
            current = neighbour
            current_cut = new_cut

        if current_cut > best_cut:
            best_cut = current_cut
            best_partition = current[:]

        cut_history.append(int(best_cut))
        T *= T_decay

    step = max(1, len(cut_history) // 100)
    downsampled = [int(v) for v in cut_history[::step]]

    return int(best_cut), [int(b) for b in best_partition], downsampled


def run_qaoa_internal(n_nodes, edges, p_layers, shots=1024, max_iter=100):
    """
    Full QAOA pipeline:
      1. Build cost Hamiltonian.
      2. Optimise gamma/beta via COBYLA (statevector expectation value).
      3. Run final circuit on AerSimulator to get measurement distribution.

    params layout: [gamma_0, ..., gamma_{p-1}, beta_0, ..., beta_{p-1}]

    Returns dict with all result fields needed by the benchmark endpoint.
    """
    H_cost = build_cost_hamiltonian_op(n_nodes, edges)

    expected_cut_history = []

    def neg_expected_cut(params):
        val = compute_expected_cut_sv(params, n_nodes, edges, p_layers, H_cost)
        expected_cut_history.append(float(val))
        return -val

    np.random.seed(42)
    x0 = np.random.uniform(0, np.pi / 2, 2 * p_layers)

    opt_result = minimize(
        neg_expected_cut,
        x0,
        method='COBYLA',
        options={'maxiter': max_iter, 'rhobeg': 0.5}
    )

    optimal_gamma = [float(v) for v in opt_result.x[:p_layers]]
    optimal_beta = [float(v) for v in opt_result.x[p_layers:]]
    expected_cut = float(-opt_result.fun)

    # Final measurement simulation with AerSimulator
    final_qc = build_qaoa_circuit_bound(n_nodes, edges, p_layers, optimal_gamma, optimal_beta)
    simulator = AerSimulator()
    job = simulator.run(final_qc, shots=shots)
    sim_result = job.result()
    counts = sim_result.get_counts(final_qc)

    total_shots = sum(counts.values())
    best_cut = 0
    best_bitstring = '0' * n_nodes
    cut_distribution_map = {}

    for bitstring, count in counts.items():
        cut = compute_cut_from_bitstring(bitstring, edges, n_nodes)
        prob = count / total_shots
        cut_distribution_map[bitstring] = {
            'cut': int(cut),
            'count': int(count),
            'probability': float(prob),
        }
        if cut > best_cut:
            best_cut = cut
            best_bitstring = bitstring

    # Top-10 bitstrings sorted by probability (descending)
    top10 = sorted(
        cut_distribution_map.items(),
        key=lambda x: x[1]['probability'],
        reverse=True
    )[:10]
    cut_distribution = [{'bitstring': bs, **info} for bs, info in top10]

    # Circuit metrics from the no-measure variant
    qc_nm = build_qaoa_circuit_no_measure(n_nodes, edges, p_layers, optimal_gamma, optimal_beta)

    return {
        'best_cut': int(best_cut),
        'best_bitstring': str(best_bitstring),
        'expected_cut': expected_cut,
        'expected_cut_history': [float(v) for v in expected_cut_history[:200]],
        'optimal_gamma': optimal_gamma,
        'optimal_beta': optimal_beta,
        'cut_distribution': cut_distribution,
        'circuit_depth': int(qc_nm.depth()),
        'gate_count': int(len(qc_nm.data)),
        'iterations': int(opt_result.nfev),
    }


# ---------------------------------------------------------------------------
# Circuit trace builder
# ---------------------------------------------------------------------------

def build_qaoa_trace(n_nodes, edges, p_layers):
    """
    Build step-by-step trace table for the QAOA circuit.

    Phases:       'init', 'superposition', 'cost', 'mixer', 'measure'
    Wire markers: '|0⟩', 'H', '●', '⊕', 'Rz', 'Rx', 'M', '-'

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
            'wire_markers': {i: wire_markers.get(i, '-') for i in range(n_nodes)},
            'phase': phase_label,
        })

    # Initialisation
    init_markers = {i: '|0\u27e9' for i in range(n_nodes)}
    append_stage('Initialize', init_markers, 'init')

    # Hadamard superposition
    for i in range(n_nodes):
        h_markers = {j: '-' for j in range(n_nodes)}
        h_markers[i] = 'H'
        append_stage(f'H on q{i}', h_markers, 'superposition')

    for layer in range(p_layers):
        layer_label = f'layer {layer + 1}'

        # Cost unitary: CNOT-Rz-CNOT per edge
        for (qi, qj) in edges:
            # First CNOT
            c1 = {j: '-' for j in range(n_nodes)}
            c1[qi] = '\u25cf'   # ●
            c1[qj] = '\u2295'   # ⊕
            append_stage(f'CNOT q{qi}\u2192q{qj} (cost {layer_label})', c1, 'cost')

            # RZ on target
            rz = {j: '-' for j in range(n_nodes)}
            rz[qj] = 'Rz'
            append_stage(f'Rz q{qj} (\u03b3 {layer_label})', rz, 'cost')

            # Second CNOT
            c2 = {j: '-' for j in range(n_nodes)}
            c2[qi] = '\u25cf'
            c2[qj] = '\u2295'
            append_stage(f'CNOT q{qi}\u2192q{qj} (cost {layer_label})', c2, 'cost')

        # Mixer unitary: RX per qubit
        for i in range(n_nodes):
            rx = {j: '-' for j in range(n_nodes)}
            rx[i] = 'Rx'
            append_stage(f'Rx q{i} (\u03b2 {layer_label})', rx, 'mixer')

    # Measurement
    for i in range(n_nodes):
        m = {j: '-' for j in range(n_nodes)}
        m[i] = 'M'
        append_stage(f'Measure q{i}', m, 'measure')

    return stages


def _build_partitions(stages):
    """
    Group consecutive stages sharing the same phase into partition blocks.
    Returns list of {stageId, label, start, end} dicts.
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

@api_bp.route('/qaoa/cases', methods=['GET'])
def qaoa_cases():
    """
    GET /api/qaoa/cases
    Returns list of all available QAOA cases.
    """
    cases = get_all_cases()
    return jsonify({'cases': cases, 'count': len(cases)})


@api_bp.route('/qaoa/dataset/<case_id>', methods=['GET'])
def qaoa_dataset(case_id):
    """
    GET /api/qaoa/dataset/<case_id>
    Returns the raw JSON dataset for a specific case.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)


@api_bp.route('/qaoa/benchmark', methods=['POST'])
def qaoa_benchmark():
    """
    POST /api/qaoa/benchmark
    Body: { "case_id": str, "shots": int }

    Runs brute-force exact Max-Cut, Simulated Annealing, and QAOA,
    then returns a full three-way comparison.
    """
    data = request.get_json() or {}
    case_id = data.get('case_id', 'QAOA-01')
    shots = int(data.get('shots', 1024))

    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_nodes = int(len(case['graph']['nodes']))
    edges = [tuple(e) for e in case['graph']['edges']]
    n_edges = int(len(edges))
    p_layers = int(case['p_layers'])

    # ── Exact brute-force ─────────────────────────────────────────────────
    t0 = time.perf_counter()
    exact_cut, exact_partition = compute_exact_maxcut(n_nodes, edges)
    exact_time_ms = (time.perf_counter() - t0) * 1000.0

    # ── Simulated Annealing ───────────────────────────────────────────────
    t1 = time.perf_counter()
    sa_cut, sa_partition, sa_cut_history = run_simulated_annealing(n_nodes, edges)
    sa_time_ms = (time.perf_counter() - t1) * 1000.0
    sa_approx_ratio = float(sa_cut / exact_cut) if exact_cut > 0 else 0.0

    # ── QAOA ──────────────────────────────────────────────────────────────
    t2 = time.perf_counter()
    qaoa = run_qaoa_internal(n_nodes, edges, p_layers, shots=shots)
    qaoa_time_ms = (time.perf_counter() - t2) * 1000.0
    qaoa_cut = int(qaoa['best_cut'])
    qaoa_approx_ratio = float(qaoa_cut / exact_cut) if exact_cut > 0 else 0.0

    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'case_id': case_id,
        'problem': case.get('problem', 'maxcut'),
        'description': case.get('description', ''),
        'n_nodes': n_nodes,
        'n_edges': n_edges,
        'edges': [[int(e[0]), int(e[1])] for e in edges],
        'nodes': [int(n) for n in case['graph']['nodes']],
        'p_layers': p_layers,
        'shots': shots,
        'exact': {
            'method': 'Brute Force Max-Cut',
            'optimal_cut': exact_cut,
            'optimal_partition': exact_partition,
            'execution_time_ms': round(exact_time_ms, 4),
            'time_complexity': f'O(2^{n_nodes})',
        },
        'classical': {
            'method': 'Simulated Annealing',
            'best_cut': sa_cut,
            'best_partition': sa_partition,
            'execution_time_ms': round(sa_time_ms, 4),
            'approx_ratio': round(sa_approx_ratio, 4),
            'cut_history': sa_cut_history,
        },
        'quantum': {
            'method': 'QAOA',
            'best_cut': qaoa_cut,
            'best_bitstring': qaoa['best_bitstring'],
            'expected_cut': float(qaoa['expected_cut']),
            'circuit_depth': int(qaoa['circuit_depth']),
            'gate_count': int(qaoa['gate_count']),
            'p_layers': p_layers,
            'n_qubits': n_nodes,
            'time_complexity': f'O({p_layers} \u00b7 {n_edges} \u00b7 shots)',
            'optimal_gamma': qaoa['optimal_gamma'],
            'optimal_beta': qaoa['optimal_beta'],
            'cut_distribution': qaoa['cut_distribution'],
            'expected_cut_history': qaoa['expected_cut_history'],
            'iterations': int(qaoa['iterations']),
            'approx_ratio': round(qaoa_approx_ratio, 4),
            'execution_time_ms': round(qaoa_time_ms, 4),
        },
        'comparison': {
            'exact_cut': exact_cut,
            'sa_cut': sa_cut,
            'qaoa_cut': qaoa_cut,
            'sa_approx_ratio': round(sa_approx_ratio, 4),
            'qaoa_approx_ratio': round(qaoa_approx_ratio, 4),
            'note': (
                f'SA achieved {sa_approx_ratio * 100:.1f}% of optimal; '
                f'QAOA achieved {qaoa_approx_ratio * 100:.1f}% of optimal'
            ),
        },
    })


@api_bp.route('/qaoa/circuit-image/<case_id>', methods=['GET'])
def qaoa_circuit_image(case_id):
    """
    GET /api/qaoa/circuit-image/<case_id>
    Returns the QAOA circuit rendered as a base-64 PNG image.
    Default display parameters: gamma = pi/4, beta = pi/8 per layer.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_nodes = int(len(case['graph']['nodes']))
    edges = [tuple(e) for e in case['graph']['edges']]
    p_layers = int(case['p_layers'])

    gamma = [np.pi / 4] * p_layers
    beta = [np.pi / 8] * p_layers

    qc = build_qaoa_circuit_bound(n_nodes, edges, p_layers, gamma, beta)

    try:
        fig = circuit_drawer(qc, output='mpl')
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor='white')
        buf.seek(0)
        img_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)

        return jsonify({
            'case_id': case_id,
            'n_nodes': n_nodes,
            'n_edges': int(len(edges)),
            'p_layers': p_layers,
            'image': img_b64,
            'depth': int(qc.depth()),
            'gate_count': int(len(qc.data)),
        })
    except Exception as exc:
        return jsonify({'error': f'Failed to generate circuit image: {exc}'}), 500


@api_bp.route('/qaoa/trace/<case_id>', methods=['GET'])
def qaoa_trace(case_id):
    """
    GET /api/qaoa/trace/<case_id>
    Returns the step-by-step trace table for the QAOA circuit.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_nodes = int(len(case['graph']['nodes']))
    edges = [tuple(e) for e in case['graph']['edges']]
    p_layers = int(case['p_layers'])

    stages = build_qaoa_trace(n_nodes, edges, p_layers)
    partitions = _build_partitions(stages)

    return jsonify({
        'case_id': case_id,
        'n_nodes': n_nodes,
        'n_edges': int(len(edges)),
        'p_layers': p_layers,
        'stages': stages,
        'partitions': partitions,
    })
