import matplotlib
matplotlib.use('Agg')

import time
import numpy as np
from scipy.optimize import minimize
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.quantum_info import SparsePauliOp, Statevector
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


def _normalize_problem(case):
    graph = case.get('graph', {}) or {}
    raw_nodes = graph.get('nodes', []) or []
    raw_edges = graph.get('edges', []) or []

    node_labels = []
    for node in raw_nodes:
        try:
            node_labels.append(int(node))
        except (TypeError, ValueError):
            continue

    edge_data = []
    for edge in raw_edges:
        parsed = _edge_from_raw(edge)
        if parsed is not None:
            edge_data.append(parsed)

    if not node_labels:
        discovered = sorted({n for u, v, _ in edge_data for n in (u, v)})
        node_labels = discovered

    if not node_labels:
        hinted = case.get('n_nodes', 2)
        try:
            hinted = int(hinted)
        except (TypeError, ValueError):
            hinted = 2
        node_labels = list(range(max(1, hinted)))

    unique_nodes = []
    seen = set()
    for label in node_labels:
        if label not in seen:
            unique_nodes.append(label)
            seen.add(label)

    index_map = {label: i for i, label in enumerate(unique_nodes)}

    normalized_edges = []
    for u_label, v_label, weight in edge_data:
        if u_label not in index_map:
            index_map[u_label] = len(index_map)
            unique_nodes.append(u_label)
        if v_label not in index_map:
            index_map[v_label] = len(index_map)
            unique_nodes.append(v_label)

        u = index_map[u_label]
        v = index_map[v_label]
        if u == v:
            continue
        normalized_edges.append((u, v, float(weight)))

    n_nodes = len(unique_nodes)
    nodes = list(range(n_nodes))
    edges = [[int(u), int(v)] for u, v, _ in normalized_edges]
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
        'edges_weighted': normalized_edges,
        'n_edges': len(normalized_edges),
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

    def neg_expectation(params):
        gamma = params[:p_layers]
        beta = params[p_layers:]
        circuit = build_qaoa_circuit_no_measure(problem, gamma, beta)
        state = Statevector(circuit)
        expected_cut = float(state.expectation_value(hamiltonian).real)
        expectation_history.append(expected_cut)
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
