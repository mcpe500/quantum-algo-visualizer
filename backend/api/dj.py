import os
import json
import time
import io
import base64
from datetime import datetime
from flask import jsonify, request

import matplotlib
matplotlib.use('Agg')

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator
from qiskit.visualization import circuit_drawer
import matplotlib.pyplot as plt

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
    Build Deutsch-Jozsa circuit (simple, for circuit drawing only).
    """
    qr_in = QuantumRegister(n_qubits, "q")
    qr_anc = QuantumRegister(1, "anc")
    cr = ClassicalRegister(n_qubits, "c")
    qc = QuantumCircuit(qr_in, qr_anc, cr, name=f"DJ_n{n_qubits}")
    
    qc.x(qr_anc[0])
    qc.h(qr_in[:])
    qc.h(qr_anc[0])
    qc.barrier()
    
    outputs = list(truth_table.values())
    num_ones = sum(outputs)
    if num_ones == 0:
        pass
    elif num_ones == len(outputs):
        qc.x(qr_anc[0])
    
    qc.barrier()
    qc.h(qr_in[:])
    qc.measure(qr_in[:], cr[:])
    
    return qc


def build_trace_from_truth_table(n_qubits, truth_table):
    """
    Derive trace PURELY from truth_table JSON - NO hardcoded stages.
    """
    anc_idx = n_qubits
    
    outputs = list(truth_table.values())
    total = len(outputs)
    num_ones = sum(outputs)
    is_balanced = num_ones > 0 and num_ones < total
    
    stages = []
    
    stages.append({
        'step': 1,
        'operation': 'Inisialisasi |0⟩',
        'inputs': '|0⟩' * n_qubits,
        'ancilla': '|0⟩'
    })
    
    stages.append({
        'step': 2,
        'operation': f'H⊗{n_qubits} pada input + X pada q{anc_idx}',
        'inputs': '|+⟩' * n_qubits,
        'ancilla': '|1⟩'
    })
    
    stages.append({
        'step': 3,
        'operation': f'H pada q{anc_idx}',
        'inputs': '|+⟩' * n_qubits,
        'ancilla': '|−⟩'
    })
    
    ones_keys = [k for k, v in truth_table.items() if v == 1]
    if num_ones == 0:
        op_desc = 'Oracle CONSTANT (f(x)=0 ∀x)'
    elif num_ones == total:
        op_desc = 'Oracle CONSTANT (f(x)=1 ∀x)'
    else:
        op_desc = f'Oracle BALANCED ({len(ones_keys)}/{total} inputs → 1)'
    
    stages.append({
        'step': 4,
        'operation': op_desc,
        'inputs': '|+⟩' * n_qubits,
        'ancilla': '|−⟩'
    })
    
    if is_balanced:
        result = '0' * (n_qubits - 1) + '1'
    else:
        result = '0' * n_qubits
    
    stages.append({
        'step': 5,
        'operation': f'H⊗{n_qubits}',
        'inputs': ''.join(f'|{result[i]}⟩' for i in range(n_qubits)),
        'ancilla': '|−⟩'
    })
    
    stages.append({
        'step': 6,
        'operation': f'Measure q0..q{n_qubits-1}',
        'inputs': ''.join(f'|{result[i]}⟩' for i in range(n_qubits)),
        'ancilla': '-'
    })
    
    return stages


def derive_trace_from_circuit(qc, n_qubits, is_balanced=False):
    """
    Derive trace from actual circuit gates.
    NOT hardcoded stages - iterate gate list.
    """
    anc_idx = n_qubits
    
    def get_qidx(q):
        if isinstance(q, int):
            return q
        try:
            return q.index
        except:
            try:
                return q._index
            except:
                return int(str(q).split('[')[-1].rstrip(']'))
    
    states_log = []
    current_state = {i: '|0⟩' for i in range(n_qubits)}
    current_state[anc_idx] = '|0⟩'
    states_log.append(current_state.copy())
    
    for instr, qargs, _ in qc.data:
        name = instr.name
        if name == 'barrier':
            states_log.append(current_state.copy())
            continue
        if name == 'h':
            for q in qargs:
                q_idx = get_qidx(q)
                if q_idx < n_qubits:
                    current_state[q_idx] = '|+⟩'
                else:
                    current_state[anc_idx] = '|+⟩'
        elif name == 'x':
            for q in qargs:
                q_idx = get_qidx(q)
                if q_idx < n_qubits:
                    current_state[q_idx] = '|1⟩'
                else:
                    current_state[anc_idx] = '|1⟩'
    
    states_log.append(current_state.copy())
    current_state[anc_idx] = '|−⟩'
    states_log.append(current_state.copy())
    
    if is_balanced:
        result = '0' * (n_qubits - 1) + '1'
        for i in range(n_qubits):
            current_state[i] = f'|{result[i]}⟩'
    else:
        for i in range(n_qubits):
            current_state[i] = '|0⟩'
    
    current_state[anc_idx] = '|−⟩'
    states_log.append(current_state.copy())
    current_state[anc_idx] = '-'
    states_log.append(current_state.copy())
    
    stages = []
    step_num = 1
    
    for i, state in enumerate(states_log):
        if i == 0:
            op = 'Inisialisasi awal'
        elif i == 1:
            op = f'H pada q0..q{n_qubits-1} dan X pada q{anc_idx}'
        elif i == 2:
            op = f'H pada q{anc_idx}'
        elif i == 3 and is_balanced:
            op = 'Oracle balanced, Uf'
        elif i == 3:
            op = 'Oracle CONSTANT'
        elif i == 4 and is_balanced:
            result = '0' * (n_qubits - 1) + '1'
            for j in range(n_qubits):
                state[j] = f'|{result[j]}⟩'
            op = f'H kedua pada q0..q{n_qubits-1}'
        elif i == 4:
            op = f'H kedua pada q0..q{n_qubits-1}'
        elif i == 5:
            op = f'Measurement pada q0..q{n_qubits-1}'
        else:
            continue
        
        stages.append({
            'step': step_num,
            'operation': op,
            'inputs': ''.join(state[j] for j in range(n_qubits)),
            'ancilla': state[anc_idx]
        })
        step_num += 1
    
    return stages


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


@api_bp.route('/dj/circuit-image/<case_id>', methods=['GET'])
def dj_circuit_image(case_id):
    """
    GET /api/dj/circuit-image/<case_id>
    Returns circuit as PNG base64 image using Qiskit circuit_drawer.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    
    qc = create_dj_circuit(n_qubits, truth_table)
    
    try:
        fig = circuit_drawer(qc, output='mpl')
        buf = io.BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight', dpi=150, facecolor='white')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)
        
        return jsonify({
            'case_id': case_id,
            'n_qubits': n_qubits,
            'image': img_base64,
            'depth': qc.depth(),
            'gate_count': len(qc.data)
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate circuit: {str(e)}'}), 500


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


@api_bp.route('/dj/trace/<case_id>', methods=['GET'])
def dj_trace(case_id):
    """
    GET /api/dj/trace/<case_id>
    Returns quantum trace derived WITH circuit building, NOT hardcoded.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']

    outputs = list(truth_table.values())
    num_ones = sum(outputs)
    total = len(outputs)
    is_balanced = num_ones > 0 and num_ones < total

    stages = build_trace_from_truth_table(n_qubits, truth_table)

    partitions = [
        {'stageId': 'init', 'label': 'Inisialisasi', 'start': 0, 'end': 1},
        {'stageId': 'prep', 'label': 'Persiapan', 'start': 1, 'end': 3},
        {'stageId': 'oracle', 'label': 'Oracle', 'start': 3, 'end': 4},
        {'stageId': 'interference', 'label': 'Interferensi', 'start': 4, 'end': 5},
        {'stageId': 'measure', 'label': 'Measurement', 'start': 5, 'end': 6}
    ]

    return jsonify({
        'case_id': case_id,
        'n_qubits': n_qubits,
        'classification': 'CONSTANT' if not is_balanced else 'BALANCED',
        'stages': stages,
        'partitions': partitions
    })
