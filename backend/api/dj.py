import os
import json
import time
from datetime import datetime
from flask import jsonify, request

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator

from api import api_bp

# __file__ is backend/api/dj.py
# backend/api -> backend -> project_root (3 levels up)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'dj')


def load_case(case_id):
    """Load a DJ case from local dataset JSON file."""
    file_path = os.path.join(DATASETS_DIR, f'{case_id}.json')
    if not os.path.exists(file_path):
        return None
    with open(file_path, 'r') as f:
        return json.load(f)


def get_all_cases():
    """Load all available DJ cases."""
    cases = []
    for i in range(1, 5):
        case_id = f'DJ-0{i}'
        case = load_case(case_id)
        if case:
            cases.append(case)
    return cases


def create_dj_circuit(n_qubits, truth_table):
    """
    Build Deutsch-Jozsa circuit from truth table.
    Uses n input qubits + 1 ancilla qubit.
    """
    qr_in = QuantumRegister(n_qubits, "q")
    qr_anc = QuantumRegister(1, "anc")
    cr = ClassicalRegister(n_qubits, "c")
    qc = QuantumCircuit(qr_in, qr_anc, cr, name=f"DJ_n{n_qubits}")

    qc.x(qr_anc[0])
    qc.h(qr_in[:])
    qc.h(qr_anc[0])

    outputs = list(truth_table.values())
    num_ones = sum(outputs)
    total = len(outputs)

    if num_ones == 0:
        pass
    elif num_ones == total:
        qc.x(n_qubits)
    else:
        for input_str, output in truth_table.items():
            if output == 1:
                indices = [idx for idx, b in enumerate(input_str) if b == '1']
                for idx in indices:
                    qc.cx(idx, n_qubits)

    qc.h(qr_in[:])
    qc.measure(qr_in[:], cr[:])

    return qc


def run_quantum_dj(n_qubits, truth_table, shots=1024):
    """
    Run DJ quantum algorithm.
    Returns result, counts, execution time, circuit depth, gate count.
    """
    start_time = time.perf_counter()

    qc = create_dj_circuit(n_qubits, truth_table)

    simulator = AerSimulator()
    job = simulator.run(qc, shots=shots)
    result = job.result()

    counts = result.get_counts(qc)

    end_time = time.perf_counter()
    execution_time = (end_time - start_time) * 1000

    all_zero = counts.keys() == {'0' * n_qubits}

    return {
        'result': 'CONSTANT' if all_zero else 'BALANCED',
        'counts': counts,
        'execution_time_ms': round(execution_time, 4),
        'circuit_depth': qc.depth(),
        'gate_count': len(qc.data),
        'num_qubits': n_qubits + 1
    }


def run_classic_brute_force(n_qubits, truth_table):
    """
    Run classical Brute Force algorithm for DJ.
    Evaluates oracle up to 2^(n-1) + 1 times.
    Returns result, evaluation count, execution time, time complexity.
    """
    start_time = time.perf_counter()

    num_inputs = 2 ** n_qubits
    first_output = None
    all_same = True

    for i in range(num_inputs):
        input_binary = format(i, f'0{n_qubits}b')
        output = truth_table.get(input_binary, 0)

        if first_output is None:
            first_output = output
        elif output != first_output:
            all_same = False
            break

    end_time = time.perf_counter()
    execution_time = (end_time - start_time) * 1000

    num_evaluations = 1 if not all_same else (num_inputs // 2 + 1)

    return {
        'result': 'CONSTANT' if all_same else 'BALANCED',
        'num_evaluations': num_evaluations,
        'worst_case_evaluations': 2 ** (n_qubits - 1) + 1,
        'execution_time_ms': round(execution_time, 4),
        'time_complexity': f"O(2^{n_qubits - 1} + 1)"
    }


@api_bp.route('/dj/benchmark', methods=['POST'])
def dj_benchmark():
    """
    POST /api/dj/benchmark
    Body: { "case_id": str, "shots": int }
    Returns quantum vs classical comparison.
    """
    data = request.get_json() or {}

    case_id = data.get('case_id', 'DJ-01')
    shots = data.get('shots', 1024)

    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']

    quantum_result = run_quantum_dj(n_qubits, truth_table, shots)
    classic_result = run_classic_brute_force(n_qubits, truth_table)

    quantum_correct = quantum_result['result'] == case['expected_classification']
    classic_correct = classic_result['result'] == case['expected_classification']

    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'case_id': case_id,
        'n_qubits': n_qubits,
        'expected_classification': case['expected_classification'],
        'shots': shots,
        'quantum': quantum_result,
        'classic': classic_result,
        'accuracy': {
            'quantum_correct': quantum_correct,
            'classic_correct': classic_correct
        },
        'comparison': {
            'quantum_calls': 1,
            'classic_calls': classic_result['num_evaluations'],
            'speedup_factor': classic_result['num_evaluations'] if classic_result['num_evaluations'] > 0 else 1
        }
    })


@api_bp.route('/dj/circuit/<int:n_qubits>', methods=['GET'])
def dj_circuit(n_qubits):
    """
    GET /api/dj/circuit/<n_qubits>
    Returns circuit structure for visualization.
    """
    n = n_qubits or 3

    truth_table = {format(i, f'0{n}b'): 0 for i in range(2 ** n)}

    qc = create_dj_circuit(n, truth_table)

    gates = []
    for instr, qargs, cargs in qc.data:
        gate_name = instr.name
        qubits = [qargs[i].index for i in range(len(qargs))]
        gates.append({
            'name': gate_name,
            'qubits': qubits,
            'params': getattr(instr, 'params', [])
        })

    return jsonify({
        'n_qubits': n,
        'depth': qc.depth(),
        'gate_count': len(qc.data),
        'gates': gates
    })


@api_bp.route('/dj/cases', methods=['GET'])
def dj_cases():
    """
    GET /api/dj/cases
    Returns list of available DJ cases.
    """
    cases = get_all_cases()
    return jsonify({'cases': cases})


@api_bp.route('/dj/dataset/<case_id>', methods=['GET'])
def dj_dataset(case_id):
    """
    GET /api/dj/dataset/<case_id>
    Returns the raw dataset JSON for a specific case.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)


def run_classic_brute_force_stepped(n_qubits, truth_table, case_id):
    """
    Run classical Brute Force algorithm with step-by-step tracking.
    Returns dict with case_id, n_qubits, classification, and steps[].
    Each step: {index, input, output, status}
    status: 'checked' if same as first output, 'differs' if different.
    Stops early for BALANCED, runs to max_evals for CONSTANT.
    """
    steps = []
    max_evals = 2 ** (n_qubits - 1) + 1

    first_input = format(0, f'0{n_qubits}b')
    first_output = truth_table[first_input]
    steps.append({
        'index': 0,
        'input': first_input,
        'output': first_output,
        'status': 'checked'
    })

    result = 'CONSTANT'
    for i in range(1, max_evals):
        input_bin = format(i, f'0{n_qubits}b')
        output = truth_table[input_bin]
        if output != first_output:
            steps.append({
                'index': i,
                'input': input_bin,
                'output': output,
                'status': 'differs'
            })
            result = 'BALANCED'
            break
        else:
            steps.append({
                'index': i,
                'input': input_bin,
                'output': output,
                'status': 'checked'
            })

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'classification': result,
        'steps': steps
    }


@api_bp.route('/dj/classic-run', methods=['POST'])
def dj_classic_run():
    """
    POST /api/dj/classic-run
    Body: { "case_id": str }
    Runs stepped brute force algorithm, saves JSON to datasets/dj/results/,
    and returns the result JSON.
    """
    data = request.get_json() or {}
    case_id = data.get('case_id', 'DJ-01')

    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']

    result = run_classic_brute_force_stepped(n_qubits, truth_table, case_id)

    results_dir = os.path.join(DATASETS_DIR, 'results')
    os.makedirs(results_dir, exist_ok=True)
    result_file = os.path.join(results_dir, f'{case_id}_classical.json')
    with open(result_file, 'w') as f:
        json.dump(result, f, indent=2)

    return jsonify(result)
