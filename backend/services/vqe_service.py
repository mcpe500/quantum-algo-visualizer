import matplotlib
matplotlib.use('Agg')

import math
import time
import numpy as np
from scipy.optimize import minimize
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp, Statevector
from qiskit.visualization import circuit_drawer
from qiskit_aer import AerSimulator
from qiskit.primitives import BackendEstimatorV2

from api.shared.plotting import figure_to_base64
from services.common import list_cases, load_case_canonical


def get_vqe_case_or_none(case_id):
    return load_case_canonical('vqe', case_id)


def get_vqe_cases():
    return list_cases('vqe', 'VQE-')


def _qubit_index(qubit):
    if hasattr(qubit, 'index'):
        return int(qubit.index)
    if hasattr(qubit, '_index'):
        return int(qubit._index)
    return 0


def build_hamiltonian_op(hamiltonian_terms):
    pauli_list = [(str(pauli), float(coeff)) for pauli, coeff in hamiltonian_terms.items()]
    if not pauli_list:
        pauli_list = [('I', 0.0)]
    return SparsePauliOp.from_list(pauli_list)


def build_ansatz_no_measure(n_qubits, ansatz_type, n_layers):
    n_params = n_qubits * n_layers
    params = ParameterVector('theta', n_params)
    qc = QuantumCircuit(n_qubits)

    for layer in range(n_layers):
        for i in range(n_qubits):
            qc.ry(params[layer * n_qubits + i], i)

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                qc.cx(i, i + 1)
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                qc.cx(i, (i + 1) % n_qubits)

    return qc, params


def build_ansatz_circuit(n_qubits, ansatz_type, n_layers):
    n_params = n_qubits * n_layers
    params = ParameterVector('theta', n_params)
    qr = QuantumRegister(n_qubits, 'q')
    cr = ClassicalRegister(n_qubits, 'c')
    qc = QuantumCircuit(qr, cr)

    for layer in range(n_layers):
        for i in range(n_qubits):
            qc.ry(params[layer * n_qubits + i], qr[i])

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                qc.cx(qr[i], qr[i + 1])
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                qc.cx(qr[i], qr[(i + 1) % n_qubits])

    qc.measure(qr, cr)
    return qc, params


def run_vqe_internal(hamiltonian_op, n_qubits, ansatz_type, n_layers, max_iter=150):
    n_params = n_qubits * n_layers
    qc, params = build_ansatz_no_measure(n_qubits, ansatz_type, n_layers)

    energy_history = []

    def energy_fn(values):
        param_dict = {params[i]: float(values[i]) for i in range(n_params)}
        qc_bound = qc.assign_parameters(param_dict)
        state = Statevector(qc_bound)
        energy = float(state.expectation_value(hamiltonian_op).real)
        energy_history.append(energy)
        return energy

    np.random.seed(42)
    x0 = np.random.uniform(0, np.pi, n_params)
    result = minimize(
        energy_fn,
        x0,
        method='COBYLA',
        options={'maxiter': int(max_iter), 'rhobeg': 0.5},
    )

    final_dict = {params[i]: float(result.x[i]) for i in range(n_params)}
    qc_final = qc.assign_parameters(final_dict)

    return {
        'energy': float(result.fun),
        'convergence_history': [float(v) for v in energy_history[:200]],
        'optimal_parameters': [float(v) for v in result.x],
        'iterations': int(result.nfev),
        'circuit_depth': int(qc_final.depth()),
        'gate_count': int(len(qc_final.data)),
    }


def build_ansatz_trace(n_qubits, ansatz_type, n_layers):
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

    append_stage('Initialize', {i: '|0>' for i in range(n_qubits)}, 'init')

    for layer in range(n_layers):
        layer_label = f'layer {layer + 1}'
        for i in range(n_qubits):
            append_stage(
                f'Ry on q{i} ({layer_label})',
                {j: ('Ry' if j == i else '-') for j in range(n_qubits)},
                'rotation',
            )

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                markers = {j: '-' for j in range(n_qubits)}
                markers[i] = '●'
                markers[i + 1] = '⊕'
                append_stage(f'CNOT q{i}->q{i + 1} ({layer_label})', markers, 'entanglement')
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                target = (i + 1) % n_qubits
                markers = {j: '-' for j in range(n_qubits)}
                markers[i] = '●'
                markers[target] = '⊕'
                append_stage(f'CNOT q{i}->q{target} ({layer_label})', markers, 'entanglement')

    for i in range(n_qubits):
        append_stage(
            f'Measure q{i}',
            {j: ('M' if j == i else '-') for j in range(n_qubits)},
            'measure',
        )

    return stages


def _build_partitions(stages):
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


def run_vqe_payload(case_id, shots):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))
    hamiltonian_terms = case.get('hamiltonian', {}).get('terms', {})

    hamiltonian_op = build_hamiltonian_op(hamiltonian_terms)

    t0 = time.perf_counter()
    hamiltonian_matrix = hamiltonian_op.to_matrix()
    eigenvalues = np.linalg.eigvalsh(hamiltonian_matrix)
    fci_energy = float(eigenvalues[0])
    fci_time_ms = (time.perf_counter() - t0) * 1000.0
    dim = int(hamiltonian_matrix.shape[0])

    t1 = time.perf_counter()
    vqe_result = run_vqe_internal(hamiltonian_op, n_qubits, ansatz_type, n_layers)
    vqe_time_ms = (time.perf_counter() - t1) * 1000.0

    vqe_energy = float(vqe_result['energy'])
    energy_error = abs(vqe_energy - fci_energy)
    denom = max(abs(fci_energy), 1e-10)
    accuracy = max(0.0, min(100.0, (1.0 - energy_error / denom) * 100.0))
    n_params = n_qubits * n_layers

    shot_eval = None
    try:
        qc_eval, params_eval = build_ansatz_no_measure(n_qubits, ansatz_type, n_layers)
        backend = AerSimulator()
        estimator = BackendEstimatorV2(backend=backend)
        precision = 1.0 / math.sqrt(int(shots))
        pub = (qc_eval, hamiltonian_op, vqe_result['optimal_parameters'], precision)
        job = estimator.run([pub])
        est_result = job.result()
        shot_energy = float(est_result[0].data.evs)
        shot_std = float(est_result[0].data.stds)
        actual_shots = int(est_result[0].metadata.get('shots', int(shots)))
        shot_error = abs(shot_energy - fci_energy)
        shot_eval = {
            'energy': shot_energy,
            'std': shot_std,
            'shots': actual_shots,
            'energy_error': float(shot_error),
        }
    except Exception:
        pass

    return {
        'case_id': case_id,
        'molecule': case.get('molecule', 'Unknown'),
        'description': case.get('description', ''),
        'n_qubits': n_qubits,
        'shots': int(shots),
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'hamiltonian_terms': hamiltonian_terms,
        'classical': {
            'method': 'FCI (Exact Diagonalization)',
            'energy': fci_energy,
            'execution_time_ms': round(fci_time_ms, 4),
            'time_complexity': f'O({dim}^3)',
            'matrix_size': f'{dim}x{dim}',
            'note': 'Full Configuration Interaction exact diagonalization.',
        },
        'quantum': {
            'method': 'VQE (Variational Quantum Eigensolver)',
            'energy': vqe_energy,
            'iterations': int(vqe_result['iterations']),
            'circuit_depth': int(vqe_result['circuit_depth']),
            'gate_count': int(vqe_result['gate_count']),
            'time_complexity': f'O({n_params} * iter)',
            'convergence_history': vqe_result['convergence_history'],
            'optimal_parameters': vqe_result['optimal_parameters'],
            'execution_time_ms': round(vqe_time_ms, 4),
            'energy_error': float(energy_error),
            'accuracy': round(float(accuracy), 4),
            'shot_evaluation': shot_eval,
        },
        'comparison': {
            'fci_energy': fci_energy,
            'vqe_energy': vqe_energy,
            'energy_error': float(energy_error),
            'accuracy_percent': round(float(accuracy), 4),
            'note': f'VQE reached {accuracy:.2f}% accuracy versus exact FCI.',
        },
    }


def get_vqe_circuit_payload(case_id, theta):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))

    qc, params = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)
    theta_value = float(theta)
    bound = qc.assign_parameters({params[i]: theta_value for i in range(len(params))})

    gates = []
    for instr, qargs, _ in bound.data:
        gates.append({
            'name': instr.name,
            'qubits': [_qubit_index(q) for q in qargs],
            'params': [float(p) if hasattr(p, '__float__') else str(p) for p in getattr(instr, 'params', [])],
        })

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'depth': int(bound.depth()),
        'gate_count': int(len(bound.data)),
        'gates': gates,
    }


def get_vqe_trace_payload(case_id, theta):
    _ = theta
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))

    stages = build_ansatz_trace(n_qubits, ansatz_type, n_layers)
    partitions = _build_partitions(stages)

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'stages': stages,
        'partitions': partitions,
    }


def get_vqe_classical_payload(case_id):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    hamiltonian_terms = case.get('hamiltonian', {}).get('terms', {})
    hamiltonian_op = build_hamiltonian_op(hamiltonian_terms)

    started = time.perf_counter()
    matrix = hamiltonian_op.to_matrix()
    eigenvalues = np.linalg.eigvalsh(matrix)
    fci_energy = float(eigenvalues[0])
    runtime_ms = (time.perf_counter() - started) * 1000.0
    dim = int(matrix.shape[0])

    return {
        'case_id': case_id,
        'molecule': case.get('molecule', 'Unknown'),
        'n_qubits': n_qubits,
        'hamiltonian_terms': hamiltonian_terms,
        'classical': {
            'method': 'FCI (Exact Diagonalization)',
            'energy': fci_energy,
            'execution_time_ms': round(runtime_ms, 4),
            'time_complexity': f'O({dim}^3)',
            'matrix_size': f'{dim}x{dim}',
            'note': 'Exact reference from Hamiltonian diagonalization.',
        },
    }


def get_vqe_circuit_image_payload(case_id):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))

    qc, params = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)
    bound = qc.assign_parameters({params[i]: float(np.pi / 4) for i in range(len(params))})

    try:
        fig = circuit_drawer(bound, output='mpl')
        return {
            'case_id': case_id,
            'n_qubits': n_qubits,
            'ansatz_type': ansatz_type,
            'n_layers': n_layers,
            'image': figure_to_base64(fig),
            'depth': int(bound.depth()),
            'gate_count': int(len(bound.data)),
        }
    except Exception as exc:
        return {'error': f'Failed to generate circuit image: {exc}'}
