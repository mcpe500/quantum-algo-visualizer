import matplotlib
matplotlib.use('Agg')

import time
import math
import numpy as np
from scipy.optimize import minimize
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.quantum_info import SparsePauliOp, Statevector, DensityMatrix, partial_trace
from qiskit_aer import AerSimulator
from qiskit.visualization import circuit_drawer

from api.shared.plotting import figure_to_base64
from services.common import list_cases, load_case


def get_qaoa_case_or_none(case_id):
    return load_case('qaoa', case_id)


def get_qaoa_cases():
    return list_cases('qaoa', 'QAOA-')


def _qubit_index(qubit):
    if hasattr(qubit, 'index'):
        return int(qubit.index)
    if hasattr(qubit, '_index'):
        return int(qubit._index)
    return 0


def _edge_from_raw(raw_edge):
    if isinstance(raw_edge, dict):
        u = raw_edge.get('u')
        v = raw_edge.get('v')
        w = raw_edge.get('weight', 1.0)
    elif isinstance(raw_edge, (list, tuple)):
        if len(raw_edge) < 2:
            return None
        u = raw_edge[0]
        v = raw_edge[1]
        w = raw_edge[2] if len(raw_edge) >= 3 else 1.0
    else:
        return None

    try:
        return int(u), int(v), float(w)
    except (TypeError, ValueError):
        return None


def _validate_adjacency_matrix(raw_matrix):
    if not isinstance(raw_matrix, list) or not raw_matrix:
        raise ValueError("adjacency_matrix must be a non-empty list")

    n = len(raw_matrix)
    matrix = []

    for i, row in enumerate(raw_matrix):
        if not isinstance(row, list) or len(row) != n:
            raise ValueError(f"adjacency_matrix row {i} must have length {n} (square matrix required)")
        clean_row = []
        for j, val in enumerate(row):
            try:
                v = int(val)
            except (TypeError, ValueError):
                raise ValueError(f"adjacency_matrix[{i}][{j}] must be an integer")
            if v not in (0, 1):
                raise ValueError(f"adjacency_matrix[{i}][{j}] must be 0 or 1, got {v}")
            clean_row.append(v)
        matrix.append(clean_row)

    for i in range(n):
        if matrix[i][i] != 0:
            raise ValueError(f"adjacency_matrix diagonal must be 0 (got {matrix[i][i]} at [{i}][{i}])")

    for i in range(n):
        for j in range(i + 1, n):
            if matrix[i][j] != matrix[j][i]:
                raise ValueError(f"adjacency_matrix must be symmetric: [{i}][{j}]={matrix[i][j]} != [{j}][{i}]={matrix[j][i]}")

    return matrix


def _normalize_problem(case):
    graph = case.get('graph', {}) or {}
    raw_matrix = graph.get('adjacency_matrix')

    if raw_matrix is None:
        raise ValueError("graph.adjacency_matrix is required in dataset JSON")

    adjacency_matrix = _validate_adjacency_matrix(raw_matrix)
    n_nodes = len(adjacency_matrix)
    nodes = list(range(n_nodes))

    edges = []
    edges_weighted = []
    for i in range(n_nodes):
        for j in range(i + 1, n_nodes):
            if adjacency_matrix[i][j] == 1:
                edges.append([i, j])
                edges_weighted.append((i, j, 1.0))

    n_edges = len(edges)

    p_layers = case.get('p_layers', 1)
    try:
        p_layers = int(p_layers)
    except (TypeError, ValueError):
        p_layers = 1
    p_layers = max(1, p_layers)

    return {
        'n_nodes': n_nodes,
        'nodes': nodes,
        'edges': edges,
        'edges_weighted': edges_weighted,
        'adjacency_matrix': adjacency_matrix,
        'n_edges': n_edges,
        'p_layers': p_layers,
        'problem': case.get('problem', 'maxcut'),
        'description': case.get('description', ''),
    }


def _get_problem_from_case(case):
    return _normalize_problem(case)


def _build_zz_pauli_string(n_nodes, q0, q1):
    chars = ['I'] * n_nodes
    chars[n_nodes - 1 - q0] = 'Z'
    chars[n_nodes - 1 - q1] = 'Z'
    return ''.join(chars)


def build_cost_hamiltonian_op(n_nodes, edges_weighted):
    identity = 'I' * n_nodes
    pauli_terms = []
    for q0, q1, weight in edges_weighted:
        pauli_terms.append((identity, 0.5 * weight))
        pauli_terms.append((_build_zz_pauli_string(n_nodes, q0, q1), -0.5 * weight))

    if not pauli_terms:
        pauli_terms.append((identity, 0.0))

    return SparsePauliOp.from_list(pauli_terms).simplify()


def _coerce_layer_params(values, p_layers, default_value):
    if isinstance(values, np.ndarray):
        values = values.tolist()

    if isinstance(values, (list, tuple)):
        parsed = []
        for value in values:
            try:
                parsed.append(float(value))
            except (TypeError, ValueError):
                continue
        if not parsed:
            parsed = [float(default_value)] * p_layers
        if len(parsed) < p_layers:
            parsed.extend([parsed[-1]] * (p_layers - len(parsed)))
        return parsed[:p_layers]

    try:
        scalar = float(values)
    except (TypeError, ValueError):
        scalar = float(default_value)
    return [scalar] * p_layers


def build_qaoa_circuit_no_measure(problem, gamma, beta):
    n_nodes = problem['n_nodes']
    p_layers = problem['p_layers']
    edges_weighted = problem['edges_weighted']

    gamma_vals = _coerce_layer_params(gamma, p_layers, 0.5)
    beta_vals = _coerce_layer_params(beta, p_layers, 0.3)

    qc = QuantumCircuit(n_nodes)
    for i in range(n_nodes):
        qc.h(i)

    for layer in range(p_layers):
        g = gamma_vals[layer]
        b = beta_vals[layer]

        for q0, q1, weight in edges_weighted:
            qc.cx(q0, q1)
            qc.rz(2.0 * g * weight, q1)
            qc.cx(q0, q1)

        for i in range(n_nodes):
            qc.rx(2.0 * b, i)

    return qc


def create_qaoa_circuit(problem, gamma, beta):
    n_nodes = problem['n_nodes']
    p_layers = problem['p_layers']
    edges_weighted = problem['edges_weighted']

    gamma_vals = _coerce_layer_params(gamma, p_layers, 0.5)
    beta_vals = _coerce_layer_params(beta, p_layers, 0.3)

    qr = QuantumRegister(n_nodes, 'q')
    cr = ClassicalRegister(n_nodes, 'c')
    qc = QuantumCircuit(qr, cr, name=f'QAOA_n{n_nodes}')

    for i in range(n_nodes):
        qc.h(qr[i])

    for layer in range(p_layers):
        g = gamma_vals[layer]
        b = beta_vals[layer]

        for q0, q1, weight in edges_weighted:
            qc.cx(qr[q0], qr[q1])
            qc.rz(2.0 * g * weight, qr[q1])
            qc.cx(qr[q0], qr[q1])

        for i in range(n_nodes):
            qc.rx(2.0 * b, qr[i])

    qc.measure(qr, cr)
    return qc


def bitstring_objective(problem, bitstring):
    n_nodes = problem['n_nodes']
    edges_weighted = problem['edges_weighted']

    bits = [int(bitstring[n_nodes - 1 - i]) for i in range(n_nodes)]
    score = 0.0
    for q0, q1, weight in edges_weighted:
        if bits[q0] != bits[q1]:
            score += float(weight)
    return score


def compute_exact_maxcut(problem):
    n_nodes = problem['n_nodes']

    best_cut = float('-inf')
    best_partition = [0] * n_nodes

    for mask in range(1 << n_nodes):
        partition = [(mask >> i) & 1 for i in range(n_nodes)]
        bitstring = ''.join(str(partition[n_nodes - 1 - i]) for i in range(n_nodes))
        score = bitstring_objective(problem, bitstring)
        if score > best_cut:
            best_cut = score
            best_partition = partition[:]

    return float(best_cut), [int(v) for v in best_partition]


def run_simulated_annealing(problem, n_iter=500):
    n_nodes = problem['n_nodes']

    np.random.seed(42)
    current = [int(v) for v in np.random.randint(0, 2, n_nodes)]

    def score(partition):
        bitstring = ''.join(str(partition[n_nodes - 1 - i]) for i in range(n_nodes))
        return bitstring_objective(problem, bitstring)

    current_score = score(current)
    best_score = current_score
    best_partition = current[:]

    temperature = 2.0
    decay = 0.99
    history = []

    for _ in range(n_iter):
        index = int(np.random.randint(0, n_nodes))
        candidate = current[:]
        candidate[index] = 1 - candidate[index]
        candidate_score = score(candidate)

        delta = candidate_score - current_score
        if delta > 0 or np.random.rand() < np.exp(delta / max(temperature, 1e-9)):
            current = candidate
            current_score = candidate_score

        if current_score > best_score:
            best_score = current_score
            best_partition = current[:]

        history.append(float(best_score))
        temperature *= decay

    step = max(1, len(history) // 100)
    downsampled = history[::step]
    return float(best_score), [int(v) for v in best_partition], downsampled


def run_qaoa_internal(problem, shots=1024, max_iter=100):
    n_nodes = problem['n_nodes']
    p_layers = problem['p_layers']

    hamiltonian = build_cost_hamiltonian_op(n_nodes, problem['edges_weighted'])
    expectation_history = []
    evaluation_history = []

    def neg_expectation(params):
        gamma = params[:p_layers]
        beta = params[p_layers:]
        circuit = build_qaoa_circuit_no_measure(problem, gamma, beta)
        state = Statevector(circuit)
        expected_cut = float(state.expectation_value(hamiltonian).real)
        expectation_history.append(expected_cut)
        evaluation_history.append({
            'eval_index': len(evaluation_history) + 1,
            'gamma': [float(v) for v in gamma],
            'beta': [float(v) for v in beta],
            'expected_cut': expected_cut,
        })
        return -expected_cut

    np.random.seed(42)
    x0 = np.random.uniform(0, np.pi / 2, 2 * p_layers)
    result = minimize(
        neg_expectation,
        x0,
        method='COBYLA',
        options={'maxiter': int(max_iter), 'rhobeg': 0.5},
    )

    optimal_gamma = [float(v) for v in result.x[:p_layers]]
    optimal_beta = [float(v) for v in result.x[p_layers:]]
    expected_cut = float(-result.fun)

    final_qc = create_qaoa_circuit(problem, optimal_gamma, optimal_beta)
    simulator = AerSimulator()
    sim_result = simulator.run(final_qc, shots=int(shots)).result()
    counts = sim_result.get_counts(final_qc)

    total = max(1, sum(counts.values()))
    cut_distribution = []
    best_cut = float('-inf')
    best_bitstring = '0' * n_nodes

    for bitstring, count in counts.items():
        cut_value = bitstring_objective(problem, bitstring)
        cut_distribution.append({
            'bitstring': str(bitstring),
            'count': int(count),
            'probability': float(count / total),
            'cut': float(cut_value),
        })
        if cut_value > best_cut:
            best_cut = cut_value
            best_bitstring = str(bitstring)

    cut_distribution.sort(key=lambda item: item['probability'], reverse=True)
    cut_distribution = cut_distribution[:10]

    no_measure_qc = build_qaoa_circuit_no_measure(problem, optimal_gamma, optimal_beta)

    return {
        'best_cut': float(best_cut),
        'best_bitstring': best_bitstring,
        'expected_cut': expected_cut,
        'circuit_depth': int(no_measure_qc.depth()),
        'gate_count': int(len(no_measure_qc.data)),
        'optimal_gamma': optimal_gamma,
        'optimal_beta': optimal_beta,
        'cut_distribution': cut_distribution,
        'expected_cut_history': [float(v) for v in expectation_history[:200]],
        'evaluation_history': evaluation_history,
        'iterations': int(result.nfev),
    }


def build_qaoa_steps(problem, gamma, beta):
    n_nodes = problem['n_nodes']
    p_layers = problem['p_layers']
    gamma_vals = _coerce_layer_params(gamma, p_layers, 0.5)
    beta_vals = _coerce_layer_params(beta, p_layers, 0.3)

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

    append_stage('Initialize', {i: '|0>' for i in range(n_nodes)}, 'init')

    for i in range(n_nodes):
        append_stage(
            f'H on q{i}',
            {j: ('H' if j == i else '-') for j in range(n_nodes)},
            'superposition',
        )

    for layer in range(p_layers):
        g = gamma_vals[layer]
        b = beta_vals[layer]
        layer_label = f'layer {layer + 1}'

        for q0, q1, weight in problem['edges_weighted']:
            markers = {j: '-' for j in range(n_nodes)}
            markers[q0] = '●'
            markers[q1] = '⊕'
            append_stage(f'CNOT q{q0}->q{q1} ({layer_label})', markers, 'cost')

            markers = {j: '-' for j in range(n_nodes)}
            markers[q1] = 'Rz'
            append_stage(
                f'Rz(2*gamma*{weight:.3f}) on q{q1} ({layer_label}, gamma={g:.4f})',
                markers,
                'cost',
            )

            markers = {j: '-' for j in range(n_nodes)}
            markers[q0] = '●'
            markers[q1] = '⊕'
            append_stage(f'CNOT q{q0}->q{q1} ({layer_label})', markers, 'cost')

        for i in range(n_nodes):
            markers = {j: '-' for j in range(n_nodes)}
            markers[i] = 'Rx'
            append_stage(f'Rx(2*beta) on q{i} ({layer_label}, beta={b:.4f})', markers, 'mixer')

    for i in range(n_nodes):
        append_stage(
            f'Measure q{i}',
            {j: ('M' if j == i else '-') for j in range(n_nodes)},
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


def _cast_cut(value):
    rounded = round(float(value))
    if abs(float(value) - rounded) < 1e-9:
        return int(rounded)
    return float(value)


def _cast_distribution(distribution):
    result = []
    for item in distribution:
        result.append({
            'bitstring': item['bitstring'],
            'count': int(item['count']),
            'probability': float(item['probability']),
            'cut': _cast_cut(item['cut']),
        })
    return result


def _sv_to_dict_list(sv):
    return [{'re': round(float(c.real), 6), 'im': round(float(c.imag), 6)} for c in sv.data]


def _extract_qubit_summaries(sv, n_nodes):
    density = DensityMatrix(sv)
    qubit_summaries = []
    all_qubits = set(range(n_nodes))

    for qubit in range(n_nodes):
        traced = list(sorted(all_qubits - {qubit}))
        reduced = partial_trace(density, traced).data if traced else density.data
        p_zero = float(np.real_if_close(reduced[0, 0]))
        p_one = float(np.real_if_close(reduced[1, 1]))
        off_diag = reduced[0, 1]
        x = float(2.0 * np.real(off_diag))
        y = float(2.0 * np.imag(off_diag))
        z = float(np.clip(p_zero - p_one, -1.0, 1.0))
        theta = float(math.acos(np.clip(z, -1.0, 1.0)))
        phi = float(math.atan2(y, x)) if abs(x) > 1e-9 or abs(y) > 1e-9 else 0.0
        qubit_summaries.append({
            'qubit': int(qubit),
            'p_zero': round(max(0.0, min(1.0, p_zero)), 6),
            'p_one': round(max(0.0, min(1.0, p_one)), 6),
            'theta': round(theta, 6),
            'phi': round(phi, 6),
        })

    return qubit_summaries


def _counts_to_cut_distribution(problem, counts, limit=10):
    total = max(1, sum(int(count) for count in counts.values()))
    distribution = []
    for bitstring, count in counts.items():
        cut_value = bitstring_objective(problem, bitstring)
        distribution.append({
            'bitstring': str(bitstring),
            'count': int(count),
            'probability': float(count / total),
            'cut': _cast_cut(cut_value),
        })
    distribution.sort(key=lambda item: (-item['probability'], -float(item['cut'])))
    return distribution[:limit]


def _bitstring_to_partition(problem, bitstring):
    n_nodes = problem['n_nodes']
    return [int(bitstring[n_nodes - 1 - i]) for i in range(n_nodes)]


def _evaluate_qaoa_checkpoint(problem, gamma, beta, shots):
    final_qc = create_qaoa_circuit(problem, gamma, beta)
    simulator = AerSimulator()
    sim_result = simulator.run(final_qc, shots=int(shots)).result()
    counts = sim_result.get_counts(final_qc)
    distribution = _counts_to_cut_distribution(problem, counts, limit=10)

    dominant = distribution[0] if distribution else None
    best = None
    for item in distribution:
        if best is None or float(item['cut']) > float(best['cut']) or (
            float(item['cut']) == float(best['cut']) and item['probability'] > best['probability']
        ):
            best = item

    dominant_partition = _bitstring_to_partition(problem, dominant['bitstring']) if dominant else [0] * problem['n_nodes']
    best_partition = _bitstring_to_partition(problem, best['bitstring']) if best else [0] * problem['n_nodes']

    return {
        'counts': counts,
        'distribution': distribution,
        'dominant_bitstring': dominant['bitstring'] if dominant else '0' * problem['n_nodes'],
        'dominant_probability': float(dominant['probability']) if dominant else 0.0,
        'dominant_cut': _cast_cut(dominant['cut']) if dominant else 0,
        'dominant_partition': dominant_partition,
        'best_bitstring': best['bitstring'] if best else '0' * problem['n_nodes'],
        'best_cut': _cast_cut(best['cut']) if best else 0,
        'best_partition': best_partition,
    }


def _build_qaoa_animation_checkpoints(evaluation_history):
    if not evaluation_history:
        return []

    selected = []
    by_kind = [
        ('initial', 0),
        ('middle', len(evaluation_history) // 2),
        ('best', max(range(len(evaluation_history)), key=lambda idx: evaluation_history[idx]['expected_cut'])),
    ]

    seen = set()
    for kind, index in by_kind:
        entry = evaluation_history[index]
        eval_index = int(entry['eval_index'])
        if eval_index in seen:
            continue
        seen.add(eval_index)
        selected.append({
            'key': f'{kind}-{eval_index}',
            'kind': kind,
            'label': {
                'initial': 'Awal',
                'middle': 'Tengah',
                'best': 'Terbaik',
            }[kind],
            'eval_index': eval_index,
            'gamma': [float(v) for v in entry['gamma']],
            'beta': [float(v) for v in entry['beta']],
            'expected_cut': float(entry['expected_cut']),
            'best_so_far': float(max(item['expected_cut'] for item in evaluation_history[:index + 1])),
        })

    return selected


def _build_qaoa_animation_partitions(timeline):
    partitions = []
    current_key = None
    start_idx = 0

    for idx, step in enumerate(timeline):
        key = (step['checkpoint_key'], step['phase'])
        if key != current_key:
            if current_key is not None:
                checkpoint_key, phase = current_key
                partitions.append({
                    'key': f'{checkpoint_key}-{phase}',
                    'checkpoint_key': checkpoint_key,
                    'checkpoint_label': timeline[start_idx]['checkpoint_label'],
                    'phase': phase,
                    'label': {
                        'optimizer': 'Optimizer',
                        'superposition': 'Superposition',
                        'cost': 'Cost',
                        'mixer': 'Mixer',
                        'measurement': 'Measurement',
                        'update': 'Update',
                    }.get(phase, phase.capitalize()),
                    'start': start_idx,
                    'end': idx,
                    'count': idx - start_idx,
                })
            current_key = key
            start_idx = idx

    if current_key is not None:
        checkpoint_key, phase = current_key
        partitions.append({
            'key': f'{checkpoint_key}-{phase}',
            'checkpoint_key': checkpoint_key,
            'checkpoint_label': timeline[start_idx]['checkpoint_label'],
            'phase': phase,
            'label': {
                'optimizer': 'Optimizer',
                'superposition': 'Superposition',
                'cost': 'Cost',
                'mixer': 'Mixer',
                'measurement': 'Measurement',
                'update': 'Update',
            }.get(phase, phase.capitalize()),
            'start': start_idx,
            'end': len(timeline),
            'count': len(timeline) - start_idx,
        })

    return partitions


def _snapshot_step(step, checkpoint, sv, measurement_distribution, operation, description, **extra):
    n_nodes = checkpoint['n_nodes']
    payload = {
        'step': int(step),
        'iteration': int(checkpoint['eval_index']),
        'checkpoint_key': checkpoint['key'],
        'checkpoint_label': checkpoint['label'],
        'checkpoint_kind': checkpoint['kind'],
        'phase': extra.pop('phase'),
        'operation': operation,
        'description': description,
        'gamma': [float(v) for v in checkpoint['gamma']],
        'beta': [float(v) for v in checkpoint['beta']],
        'expected_cut': float(checkpoint['expected_cut']),
        'best_so_far': float(checkpoint['best_so_far']),
        'statevector': _sv_to_dict_list(sv),
        'qubit_summaries': _extract_qubit_summaries(sv, n_nodes),
        'measurement_distribution': measurement_distribution,
    }
    payload.update(extra)
    return payload


def _build_qaoa_checkpoint_timeline(problem, checkpoint, shots, start_step):
    n_nodes = problem['n_nodes']
    measurement = _evaluate_qaoa_checkpoint(problem, checkpoint['gamma'], checkpoint['beta'], shots)
    distribution = measurement['distribution']
    timeline = []
    step = start_step

    checkpoint = {
        **checkpoint,
        'n_nodes': n_nodes,
    }

    sv = Statevector.from_label('0' * n_nodes)
    timeline.append(_snapshot_step(
        step,
        checkpoint,
        sv,
        distribution,
        'Optimizer proposes parameters',
        f"Optimizer klasik memilih parameter awal untuk evaluasi iterasi ke-{checkpoint['eval_index']}: γ={', '.join(f'{g:.3f}' for g in checkpoint['gamma'])} dan β={', '.join(f'{b:.3f}' for b in checkpoint['beta'])}.",
        phase='optimizer',
        candidate_bitstring=measurement['dominant_bitstring'],
        cut_value=measurement['dominant_cut'],
        dominant_probability=measurement['dominant_probability'],
      ))
    step += 1

    superposition_qc = QuantumCircuit(n_nodes)
    for qubit in range(n_nodes):
        superposition_qc.h(qubit)
    sv = sv.evolve(superposition_qc)
    timeline.append(_snapshot_step(
        step,
        checkpoint,
        sv,
        distribution,
        'Hadamard layer on all qubits',
        'Semua qubit dibuka ke superposisi sebagai state awal ansatz QAOA. Ini membuat seluruh ruang partisi dapat dijelajahi secara paralel.',
        phase='superposition',
      ))
    step += 1

    for layer in range(problem['p_layers']):
        gamma = checkpoint['gamma'][layer]
        beta = checkpoint['beta'][layer]

        for edge in problem['edges_weighted']:
            q0, q1, weight = edge
            edge_qc = QuantumCircuit(n_nodes)
            edge_qc.cx(q0, q1)
            edge_qc.rz(2.0 * gamma * weight, q1)
            edge_qc.cx(q0, q1)
            sv = sv.evolve(edge_qc)
            timeline.append(_snapshot_step(
                step,
                checkpoint,
                sv,
                distribution,
                f'Cost unitary ZZ on edge ({q0}, {q1})',
                f'Term Hamiltonian Ising untuk edge ({q0}, {q1}) diterapkan melalui CX-Rz-CX dengan sudut 2γw = {(2.0 * gamma * weight):.3f} rad.',
                phase='cost',
                layer=int(layer + 1),
                edge=[int(q0), int(q1)],
              ))
            step += 1

        for qubit in range(n_nodes):
            mixer_qc = QuantumCircuit(n_nodes)
            mixer_qc.rx(2.0 * beta, qubit)
            sv = sv.evolve(mixer_qc)
            timeline.append(_snapshot_step(
                step,
                checkpoint,
                sv,
                distribution,
                f'Mixer Rx on q{qubit}',
                f'Operator mixer Rx(2β) pada q{qubit} menjaga eksplorasi ruang solusi dengan sudut {(2.0 * beta):.3f} rad.',
                phase='mixer',
                layer=int(layer + 1),
                target_qubit=int(qubit),
              ))
            step += 1

    timeline.append(_snapshot_step(
        step,
        checkpoint,
        sv,
        distribution,
        'Measure and sample bitstrings',
        f"State diukur sebanyak {shots} shots. Bitstring dominan saat checkpoint ini adalah {measurement['dominant_bitstring']} dengan probabilitas {measurement['dominant_probability'] * 100:.1f}%.",
        phase='measurement',
        candidate_bitstring=measurement['dominant_bitstring'],
        cut_value=measurement['dominant_cut'],
        dominant_probability=measurement['dominant_probability'],
      ))
    step += 1

    timeline.append(_snapshot_step(
        step,
        checkpoint,
        sv,
        distribution,
        'Optimizer updates objective',
        f"Expected cut untuk checkpoint ini adalah {checkpoint['expected_cut']:.3f}, sedangkan nilai terbaik sejauh ini {checkpoint['best_so_far']:.3f}. Optimizer memakai informasi ini untuk memperbarui parameter iterasi berikutnya.",
        phase='update',
        candidate_bitstring=measurement['best_bitstring'],
        cut_value=measurement['best_cut'],
        dominant_probability=measurement['dominant_probability'],
      ))

    return timeline, step + 1, measurement


def run_qaoa_payload(case_id, shots):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return None

    problem = _get_problem_from_case(case)

    t_exact = time.perf_counter()
    exact_cut, exact_partition = compute_exact_maxcut(problem)
    exact_time_ms = (time.perf_counter() - t_exact) * 1000.0

    t_sa = time.perf_counter()
    sa_cut, sa_partition, sa_history = run_simulated_annealing(problem)
    sa_time_ms = (time.perf_counter() - t_sa) * 1000.0

    t_qaoa = time.perf_counter()
    qaoa = run_qaoa_internal(problem, shots=int(shots))
    qaoa_time_ms = (time.perf_counter() - t_qaoa) * 1000.0

    qaoa_cut = float(qaoa['best_cut'])
    denom = exact_cut if abs(exact_cut) > 1e-12 else 1.0
    sa_ratio = float(sa_cut / denom)
    qaoa_ratio = float(qaoa_cut / denom)

    return {
        'case_id': case_id,
        'problem': problem['problem'],
        'description': problem['description'],
        'n_nodes': int(problem['n_nodes']),
        'n_edges': int(problem['n_edges']),
        'edges': problem['edges'],
        'nodes': problem['nodes'],
        'adjacency_matrix': problem['adjacency_matrix'],
        'p_layers': int(problem['p_layers']),
        'shots': int(shots),
        'exact': {
            'method': 'Brute Force Max-Cut',
            'optimal_cut': _cast_cut(exact_cut),
            'optimal_partition': exact_partition,
            'execution_time_ms': round(exact_time_ms, 4),
            'time_complexity': f'O(2^{problem["n_nodes"]})',
        },
        'classical': {
            'method': 'Simulated Annealing',
            'best_cut': _cast_cut(sa_cut),
            'best_partition': sa_partition,
            'execution_time_ms': round(sa_time_ms, 4),
            'approx_ratio': round(sa_ratio, 4),
            'cut_history': [_cast_cut(v) for v in sa_history],
        },
        'quantum': {
            'method': 'QAOA',
            'best_cut': _cast_cut(qaoa_cut),
            'best_bitstring': qaoa['best_bitstring'],
            'expected_cut': float(qaoa['expected_cut']),
            'circuit_depth': int(qaoa['circuit_depth']),
            'gate_count': int(qaoa['gate_count']),
            'p_layers': int(problem['p_layers']),
            'n_qubits': int(problem['n_nodes']),
            'time_complexity': f'O({problem["p_layers"]} * {problem["n_edges"]} * shots)',
            'optimal_gamma': qaoa['optimal_gamma'],
            'optimal_beta': qaoa['optimal_beta'],
            'cut_distribution': _cast_distribution(qaoa['cut_distribution']),
            'expected_cut_history': [float(v) for v in qaoa['expected_cut_history']],
            'iterations': int(qaoa['iterations']),
            'approx_ratio': round(qaoa_ratio, 4),
            'execution_time_ms': round(qaoa_time_ms, 4),
        },
        'comparison': {
            'exact_cut': _cast_cut(exact_cut),
            'sa_cut': _cast_cut(sa_cut),
            'qaoa_cut': _cast_cut(qaoa_cut),
            'sa_approx_ratio': round(sa_ratio, 4),
            'qaoa_approx_ratio': round(qaoa_ratio, 4),
            'note': f'SA={sa_ratio * 100:.1f}% and QAOA={qaoa_ratio * 100:.1f}% of exact optimum.',
        },
    }


def get_qaoa_animation_payload(case_id, shots=1024):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return None

    problem = _get_problem_from_case(case)

    exact_cut, exact_partition = compute_exact_maxcut(problem)
    sa_cut, sa_partition, sa_history = run_simulated_annealing(problem)
    qaoa = run_qaoa_internal(problem, shots=int(shots))

    qaoa_cut = float(qaoa['best_cut'])
    denom = exact_cut if abs(exact_cut) > 1e-12 else 1.0
    sa_ratio = float(sa_cut / denom)
    qaoa_ratio = float(qaoa_cut / denom)

    checkpoints = _build_qaoa_animation_checkpoints(qaoa.get('evaluation_history', []))

    timeline = []
    checkpoint_results = []
    next_step = 0
    for checkpoint in checkpoints:
        checkpoint_timeline, next_step, measurement = _build_qaoa_checkpoint_timeline(problem, checkpoint, shots, next_step)
        timeline.extend(checkpoint_timeline)
        checkpoint_results.append({
            **checkpoint,
            'dominant_bitstring': measurement['dominant_bitstring'],
            'dominant_cut': measurement['dominant_cut'],
            'dominant_probability': measurement['dominant_probability'],
            'dominant_partition': measurement['dominant_partition'],
            'best_bitstring': measurement['best_bitstring'],
            'best_cut': measurement['best_cut'],
            'best_partition': measurement['best_partition'],
        })

    partitions = _build_qaoa_animation_partitions(timeline)

    return {
        'case_id': case_id,
        'problem': problem['problem'],
        'description': problem['description'],
        'n_nodes': int(problem['n_nodes']),
        'n_edges': int(problem['n_edges']),
        'nodes': problem['nodes'],
        'edges': problem['edges'],
        'adjacency_matrix': problem['adjacency_matrix'],
        'p_layers': int(problem['p_layers']),
        'shots': int(shots),
        'hamiltonian': {
            'label': 'Max-Cut Ising Hamiltonian',
            'formula': 'H_C = Σ (I - Z_i Z_j) / 2',
            'terms': [
                {
                    'edge': [int(q0), int(q1)],
                    'pauli': f'Z{q0}Z{q1}',
                    'weight': float(weight),
                }
                for q0, q1, weight in problem['edges_weighted']
            ],
        },
        'checkpoints': checkpoint_results,
        'partitions': partitions,
        'timeline': timeline,
        'exact': {
            'method': 'Brute Force Max-Cut',
            'optimal_cut': _cast_cut(exact_cut),
            'optimal_partition': exact_partition,
            'execution_time_ms': 0.0,
            'time_complexity': f'O(2^{problem["n_nodes"]})',
        },
        'classical': {
            'method': 'Simulated Annealing',
            'best_cut': _cast_cut(sa_cut),
            'best_partition': sa_partition,
            'execution_time_ms': 0.0,
            'approx_ratio': round(sa_ratio, 4),
            'cut_history': [_cast_cut(v) for v in sa_history],
        },
        'quantum': {
            'method': 'QAOA',
            'best_cut': _cast_cut(qaoa_cut),
            'best_bitstring': qaoa['best_bitstring'],
            'expected_cut': float(qaoa['expected_cut']),
            'circuit_depth': int(qaoa['circuit_depth']),
            'gate_count': int(qaoa['gate_count']),
            'p_layers': int(problem['p_layers']),
            'n_qubits': int(problem['n_nodes']),
            'time_complexity': f'O({problem["p_layers"]} * {problem["n_edges"]} * shots)',
            'optimal_gamma': qaoa['optimal_gamma'],
            'optimal_beta': qaoa['optimal_beta'],
            'cut_distribution': _cast_distribution(qaoa['cut_distribution']),
            'expected_cut_history': [float(v) for v in qaoa['expected_cut_history']],
            'iterations': int(qaoa['iterations']),
            'approx_ratio': round(qaoa_ratio, 4),
            'execution_time_ms': 0.0,
        },
        'comparison': {
            'exact_cut': _cast_cut(exact_cut),
            'sa_cut': _cast_cut(sa_cut),
            'qaoa_cut': _cast_cut(qaoa_cut),
            'sa_approx_ratio': round(sa_ratio, 4),
            'qaoa_approx_ratio': round(qaoa_ratio, 4),
            'note': f'SA={sa_ratio * 100:.1f}% dan QAOA={qaoa_ratio * 100:.1f}% dari optimum eksak.',
        },
    }


def get_qaoa_circuit_payload(case_id, gamma, beta):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return None

    problem = _get_problem_from_case(case)
    gamma_vals = _coerce_layer_params(gamma, problem['p_layers'], 0.5)
    beta_vals = _coerce_layer_params(beta, problem['p_layers'], 0.3)

    qc = create_qaoa_circuit(problem, gamma_vals, beta_vals)
    gates = []
    for instr, qargs, _ in qc.data:
        gates.append({
            'name': instr.name,
            'qubits': [_qubit_index(q) for q in qargs],
            'params': [float(p) if hasattr(p, '__float__') else str(p) for p in getattr(instr, 'params', [])],
        })

    return {
        'case_id': case_id,
        'n_qubits': int(problem['n_nodes']),
        'p_layers': int(problem['p_layers']),
        'gamma': gamma_vals,
        'beta': beta_vals,
        'depth': int(qc.depth()),
        'gate_count': int(len(qc.data)),
        'gates': gates,
    }


def get_qaoa_trace_payload(case_id, gamma, beta):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return None

    problem = _get_problem_from_case(case)
    gamma_vals = _coerce_layer_params(gamma, problem['p_layers'], 0.5)
    beta_vals = _coerce_layer_params(beta, problem['p_layers'], 0.3)

    stages = build_qaoa_steps(problem, gamma_vals, beta_vals)
    partitions = _build_partitions(stages)

    return {
        'case_id': case_id,
        'n_nodes': int(problem['n_nodes']),
        'n_edges': int(problem['n_edges']),
        'p_layers': int(problem['p_layers']),
        'stages': stages,
        'partitions': partitions,
    }


def get_qaoa_classical_payload(case_id):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return None

    problem = _get_problem_from_case(case)

    exact_cut, exact_partition = compute_exact_maxcut(problem)
    sa_cut, sa_partition, sa_history = run_simulated_annealing(problem)
    denom = exact_cut if abs(exact_cut) > 1e-12 else 1.0

    return {
        'case_id': case_id,
        'algorithm': 'QAOA_CLASSICAL_BASELINE',
        'n_nodes': int(problem['n_nodes']),
        'n_edges': int(problem['n_edges']),
        'nodes': problem['nodes'],
        'edges': problem['edges'],
        'adjacency_matrix': problem['adjacency_matrix'],
        'exact': {
            'optimal_cut': _cast_cut(exact_cut),
            'optimal_partition': exact_partition,
        },
        'classical': {
            'best_cut': _cast_cut(sa_cut),
            'best_partition': sa_partition,
            'approx_ratio': round(float(sa_cut / denom), 4),
            'cut_history': [_cast_cut(v) for v in sa_history],
        },
    }


def get_qaoa_circuit_image_payload(case_id, gamma=0.5, beta=0.3):
    case = get_qaoa_case_or_none(case_id)
    if not case:
        return None

    problem = _get_problem_from_case(case)
    gamma_vals = _coerce_layer_params(gamma, problem['p_layers'], 0.5)
    beta_vals = _coerce_layer_params(beta, problem['p_layers'], 0.3)
    qc = create_qaoa_circuit(problem, gamma_vals, beta_vals)

    try:
        fig = circuit_drawer(qc, output='mpl')
        return {
            'case_id': case_id,
            'n_qubits': int(problem['n_nodes']),
            'p_layers': int(problem['p_layers']),
            'image': figure_to_base64(fig),
            'depth': int(qc.depth()),
            'gate_count': int(len(qc.data)),
        }
    except Exception as exc:
        return {'error': f'Failed to generate circuit image: {exc}'}


def enrich_case_graph(case):
    if not case:
        return case
    problem = _normalize_problem(case)
    enriched = dict(case)
    graph = dict(enriched.get('graph', {}) or {})
    graph['nodes'] = problem['nodes']
    graph['edges'] = problem['edges']
    graph['adjacency_matrix'] = problem['adjacency_matrix']
    enriched['graph'] = graph
    return enriched
