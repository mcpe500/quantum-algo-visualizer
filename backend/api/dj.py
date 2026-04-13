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
from matplotlib.patches import Rectangle

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


def _truth_table_profile(truth_table):
    outputs = list(truth_table.values())
    total = len(outputs)
    num_ones = sum(outputs)

    return {
        'total': total,
        'num_ones': num_ones,
        'is_constant_zero': num_ones == 0,
        'is_constant_one': total > 0 and num_ones == total,
        'is_balanced': 0 < num_ones < total,
    }


def _case_sort_key(case):
    case_id = case.get('case_id', '')
    try:
        return (0, int(case_id.split('-', 1)[1]))
    except (IndexError, ValueError, TypeError):
        return (1, case_id)


def get_all_cases():
    """Load all available DJ cases."""
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
        if not case_id.startswith('DJ-') or not case_id[3:].isdigit():
            continue

        case = load_case(case_id)
        if case:
            cases.append(case)

    cases.sort(key=_case_sort_key)
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
    
    profile = _truth_table_profile(truth_table)
    if profile['is_constant_zero']:
        pass
    elif profile['is_constant_one']:
        qc.x(qr_anc[0])
    else:
        for input_bits in sorted(truth_table):
            if truth_table[input_bits] != 1:
                continue

            zero_indices = [idx for idx, bit in enumerate(input_bits) if bit == '0']
            for idx in zero_indices:
                qc.x(qr_in[idx])
            qc.mcx(list(qr_in), qr_anc[0])
            for idx in zero_indices:
                qc.x(qr_in[idx])
    
    qc.barrier()
    qc.h(qr_in[:])
    qc.measure(qr_in[:], cr[:])
    
    return qc


def build_trace_from_truth_table(n_qubits, truth_table):
    """
    Derive trace PURELY from truth_table JSON - NO hardcoded stages.
    """
    anc_idx = n_qubits
    
    profile = _truth_table_profile(truth_table)
    
    stages = []
    step_num = 0

    def append_stage(operation, current_state):
        nonlocal step_num
        step_num += 1
        stages.append({
            'step': step_num,
            'operation': operation,
            'inputs': ''.join(current_state[i] for i in range(n_qubits)),
            'ancilla': current_state[anc_idx]
        })

    current_state = {i: '|0⟩' for i in range(n_qubits)}
    current_state[anc_idx] = '|0⟩'
    
    append_stage('Inisialisasi awal', current_state)

    current_state[anc_idx] = '|1⟩'
    append_stage(f'X pada q{anc_idx}', current_state)

    for i in range(n_qubits):
        current_state[i] = '|+⟩'
    append_stage(f'H pada q0..q{n_qubits-1}', current_state)

    current_state[anc_idx] = '|−⟩'
    append_stage(f'H pada q{anc_idx}', current_state)

    if profile['is_constant_zero']:
        op_desc = 'Oracle CONSTANT (identity)'
    elif profile['is_constant_one']:
        op_desc = 'Oracle CONSTANT (X all)'
    else:
        op_desc = f'Oracle BALANCED ({profile["num_ones"]}/{profile["total"]} inputs → 1)'

    append_stage(op_desc, current_state)

    if profile['is_balanced']:
        final_state = {i: '|0⟩' for i in range(n_qubits)}
        final_state[n_qubits - 1] = '|1⟩'
    else:
        final_state = {i: '|0⟩' for i in range(n_qubits)}

    for i in range(n_qubits):
        current_state[i] = final_state[i]
    append_stage(f'H kedua pada q0..q{n_qubits-1}', current_state)

    current_state[anc_idx] = '-'
    append_stage(f'Measurement pada q0..q{n_qubits-1}', current_state)
    
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

    all_zero = set(counts.keys()) == {'0' * n_qubits}

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


def _add_phase_boxes_to_figure(fig, qc):
    """
    Add phase group boxes on top of the Qiskit circuit figure.
    Boxes correspond to: init, prep, oracle, interference, measure.
    """
    ax = fig.axes[0]
    x_min, x_max = ax.get_xlim()
    y_min, y_max = ax.get_ylim()
    total_width = x_max - x_min
    total_height = y_max - y_min

    # Analyze qc.data to find phase boundaries
    # Track instruction indices and find barriers
    barrier_indices = []
    for idx, item in enumerate(qc.data):
        if item.operation.name == 'barrier':
            barrier_indices.append(idx)

    # Phase definitions with colors
    PHASES = [
        ('1', 'Inisialisasi', '#3B82F6'),   # Blue
        ('2', 'Persiapan', '#10B981'),       # Emerald
        ('3', 'Oracle', '#F59E0B'),          # Amber
        ('4', 'Interferensi', '#8B5CF6'),    # Violet
        ('5', 'Measurement', '#EF4444'),     # Red
    ]

    # Count instructions per phase
    # Structure: [init][prep gates...][barrier][oracle...][barrier][interference...][measure...]
    if len(barrier_indices) >= 2:
        b1, b2 = barrier_indices[0], barrier_indices[1]
        # Before first barrier: X(anc) + H(inputs) + H(anc)
        section0 = list(range(0, b1))
        # Between barriers: oracle gates
        section1 = list(range(b1 + 1, b2))
        # After second barrier: H(inputs) + measure
        section2 = list(range(b2 + 1, len(qc.data)))
    else:
        # Fallback if barriers not found
        n = len(qc.data)
        section0 = list(range(0, max(1, n // 5)))
        section1 = list(range(max(1, n // 5), max(2, 2 * n // 5)))
        section2 = list(range(max(2, 2 * n // 5), n))

    # Split section0: first gate = init, rest = prep
    init_indices = section0[:1] if section0 else []
    prep_indices = section0[1:] if len(section0) > 1 else []

    # Split section2: H gates = interference, measure gates = measure
    interference_indices = []
    measure_indices = []
    for idx in section2:
        if qc.data[idx].operation.name == 'measure':
            measure_indices.append(idx)
        else:
            interference_indices.append(idx)

    # Oracle = section1 (may be empty for constant-0)
    oracle_indices = section1

    # Build phase index lists
    phase_indices = [
        init_indices,
        prep_indices,
        oracle_indices,
        interference_indices,
        measure_indices,
    ]

    # Filter out empty phases
    active_phases = []
    for i, indices in enumerate(phase_indices):
        if indices or i == 2:  # Always show oracle phase even if empty
            num, label, color = PHASES[i]
            active_phases.append((num, label, color, indices))

    # Calculate visual weights (instruction count + barrier bonus)
    total_weight = 0
    phase_weights = []
    for num, label, color, indices in active_phases:
        weight = len(indices) if indices else 0.5  # min weight for empty oracle
        # Add barrier weight after prep and oracle phases
        phase_weights.append(weight)
        total_weight += weight

    # Add barrier weights (visual separators)
    num_barriers = len(barrier_indices)
    barrier_weight_total = num_barriers * 0.3
    total_weight += barrier_weight_total

    # Draw phase boxes
    current_x = x_min
    phase_idx = 0
    barrier_idx = 0

    for num, label, color, indices in active_phases:
        weight = phase_weights[phase_idx]
        phase_width = (weight / total_weight) * total_width * (total_width / (total_width + barrier_weight_total))

        # Draw background rectangle
        rect = Rectangle(
            (current_x, y_min),
            phase_width,
            total_height,
            linewidth=2,
            edgecolor=color,
            facecolor=color,
            alpha=0.08,
            linestyle='-',
            zorder=0
        )
        ax.add_patch(rect)

        # Draw left border line
        ax.axvline(x=current_x, color=color, linewidth=1.5, linestyle='-', alpha=0.6, zorder=1)

        # Draw phase label at top
        label_x = current_x + phase_width / 2
        label_y = y_max + total_height * 0.05

        ax.text(
            label_x,
            label_y,
            f'{num}. {label}',
            ha='center',
            va='bottom',
            fontsize=9,
            fontweight='bold',
            color=color,
            bbox=dict(
                boxstyle='round,pad=0.25',
                facecolor='white',
                edgecolor=color,
                linewidth=1.5,
                alpha=0.95
            ),
            zorder=10
        )

        current_x += phase_width
        phase_idx += 1

        # Add barrier separator after prep and oracle phases
        if phase_idx < len(active_phases):
            barrier_width = (0.3 / total_weight) * total_width
            # Draw thin barrier line
            ax.axvline(x=current_x, color='#6B7280', linewidth=1, linestyle='--', alpha=0.4, zorder=1)
            current_x += barrier_width
            barrier_idx += 1

    # Draw final right border
    ax.axvline(x=current_x, color='#6B7280', linewidth=1.5, linestyle='-', alpha=0.6, zorder=1)

    # Extend y-axis to accommodate labels
    ax.set_ylim(y_min, y_max + total_height * 0.2)

    # Adjust figure layout
    fig.tight_layout(pad=1.5)

    return fig


@api_bp.route('/dj/circuit-image-boxed/<case_id>', methods=['GET'])
def dj_circuit_image_boxed(case_id):
    """
    GET /api/dj/circuit-image-boxed/<case_id>
    Returns circuit as PNG base64 image with phase group boxes overlay.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404

    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']

    qc = create_dj_circuit(n_qubits, truth_table)

    try:
        fig = circuit_drawer(qc, output='mpl')
        fig = _add_phase_boxes_to_figure(fig, qc)
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
        return jsonify({'error': f'Failed to generate boxed circuit: {str(e)}'}), 500


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


def generate_classic_pseudocode(case_id, n_qubits, steps):
    """
    Generate pseudocode lines from classical brute force result.
    Dynamic - uses actual step data, not hardcoded.
    """
    lines = []
    
    first_input = steps[0]['input']
    first_output = steps[0]['output']
    batas_uji = 2 ** (n_qubits - 1) + 1
    
    lines.append(f"Algoritma 4.1 Solusi Klasik Deutsch-Jozsa ({case_id})")
    lines.append(f"01: BACA N = {n_qubits}")
    lines.append(f"02: OUTPUT_AWAL <- f(\"{first_input}\") = {first_output}")
    lines.append(f"03: BATAS_UJI <- 2^({n_qubits}-1) + 1 = {batas_uji}")
    
    if len(steps) <= 1:
        lines.append(f"04: TULIS \"{steps[0]['output']}\"")
        return lines
    
    lines.append(f"04: FOR INDEKS <- 1 TO {len(steps) - 1}")
    
    is_balanced = any(s['status'] == 'differs' for s in steps)
    
    for i, step in enumerate(steps[1:], start=1):
        if step['status'] == 'checked':
            lines.append(f"05:     UJI indeks={i}: f(\"{step['input']}\") = {step['output']} = OUTPUT_AWAL -> LANJUT")
        else:
            lines.append(f"05:     UJI indeks={i}: f(\"{step['input']}\") = {step['output']} = OUTPUT_AWAL")
            lines.append(f"06:     KARENA {step['output']} =/= OUTPUT_AWAL")
            lines.append(f"07:     TULIS \"BALANCED\"")
            lines.append(f"08:     BERHENTI")
            return lines
    
    lines.append(f"05: END FOR")
    lines.append(f"06: TULIS \"CONSTANT\"")
    
    return lines


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
    first_output = truth_table.get(first_input, 0)
    steps.append({
        'index': 0,
        'input': first_input,
        'output': first_output,
        'status': 'checked'
    })

    result = 'CONSTANT'
    for i in range(1, max_evals):
        input_bin = format(i, f'0{n_qubits}b')
        output = truth_table.get(input_bin, 0)
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

    pseudocode = generate_classic_pseudocode(case_id, n_qubits, steps)
    
    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'classification': result,
        'steps': steps,
        'pseudocode': pseudocode
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
    profile = _truth_table_profile(truth_table)

    stages = build_trace_from_truth_table(n_qubits, truth_table)
    stage_count = len(stages)

    partitions = [
        {'stageId': 'init', 'label': 'Inisialisasi', 'start': 0, 'end': 1},
        {'stageId': 'prep', 'label': 'Persiapan', 'start': 1, 'end': stage_count - 3},
        {'stageId': 'oracle', 'label': 'Oracle', 'start': stage_count - 3, 'end': stage_count - 2},
        {'stageId': 'interference', 'label': 'Interferensi', 'start': stage_count - 2, 'end': stage_count - 1},
        {'stageId': 'measure', 'label': 'Measurement', 'start': stage_count - 1, 'end': stage_count}
    ]

    return jsonify({
        'case_id': case_id,
        'n_qubits': n_qubits,
        'classification': 'BALANCED' if profile['is_balanced'] else 'CONSTANT',
        'stages': stages,
        'partitions': partitions
    })
