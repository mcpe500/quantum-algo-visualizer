import matplotlib
matplotlib.use('Agg')
import math
import time
from datetime import datetime
import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator
from qiskit.quantum_info import Statevector
from qiskit.visualization import circuit_drawer
from api.shared.dj_partition import partition_stage_groups
from api.shared.plotting import add_phase_boxes_to_figure, figure_to_base64
from services.common import list_cases, load_case

def get_dj_case_or_none(case_id):
    return load_case('dj', case_id)

def get_dj_cases():
    return list_cases('dj', 'DJ-')

def truth_table_profile(truth_table):
    outputs = list(truth_table.values())
    total = len(outputs)
    num_ones = sum(outputs)
    return {'total': total, 'num_ones': num_ones, 'is_constant_zero': num_ones == 0, 'is_constant_one': total > 0 and num_ones == total, 'is_balanced': 0 < num_ones < total}

def create_dj_circuit(n_qubits, truth_table):
    qr_in = QuantumRegister(n_qubits, 'q')
    qr_anc = QuantumRegister(1, 'anc')
    cr = ClassicalRegister(n_qubits, 'c')
    qc = QuantumCircuit(qr_in, qr_anc, cr, name=f'DJ_n{n_qubits}')
    qc.x(qr_anc[0])
    qc.h(qr_in[:])
    qc.h(qr_anc[0])
    qc.barrier()
    profile = truth_table_profile(truth_table)
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

def build_trace_by_layer(n_qubits, truth_table):
    anc_idx = n_qubits
    profile = truth_table_profile(truth_table)
    stages = []
    step_num = 0
    def append_stage(operation, wire_markers, phase_label):
        nonlocal step_num
        step_num += 1
        markers = {i: wire_markers.get(i, '-') for i in range(n_qubits)}
        markers[anc_idx] = wire_markers.get(anc_idx, '-')
        stages.append({'step': step_num, 'operation': operation, 'wire_markers': markers, 'ancilla_marker': wire_markers.get(anc_idx, '-'), 'phase': phase_label})
    col0_markers = {i: 'H' for i in range(n_qubits)}
    col0_markers[anc_idx] = 'X'
    append_stage('X H H', col0_markers, 'init')
    col1_markers = {i: '-' for i in range(n_qubits)}
    col1_markers[anc_idx] = 'H'
    append_stage('H (anc)', col1_markers, 'prep')
    if profile['is_balanced']:
        for input_bits in sorted(truth_table):
            if truth_table[input_bits] != 1:
                continue
            flip_markers = {i: ('X' if input_bits[i] == '0' else '-') for i in range(n_qubits)}
            flip_markers[anc_idx] = '-'
            append_stage('Flip ' + input_bits, flip_markers, 'oracle')
            cnot_markers = {i: '●' for i in range(n_qubits)}
            cnot_markers[anc_idx] = '⊕'
            append_stage('CNOT ' + input_bits, cnot_markers, 'oracle')
            rest_markers = {i: ('X' if input_bits[i] == '0' else '-') for i in range(n_qubits)}
            rest_markers[anc_idx] = '-'
            append_stage('Restore ' + input_bits, rest_markers, 'oracle')
    h_final_markers = {i: 'H' for i in range(n_qubits)}
    h_final_markers[anc_idx] = '-'
    append_stage('H (final)', h_final_markers, 'interference')
    for i in range(n_qubits):
        m_markers = {j: ('M' if j == i else '-') for j in range(n_qubits)}
        m_markers[anc_idx] = '-'
        append_stage(f'M on q{i}', m_markers, 'measure')
    return stages

def build_trace_from_truth_table(n_qubits, truth_table):
    return build_trace_by_layer(n_qubits, truth_table)

def run_quantum_dj(n_qubits, truth_table, shots=1024):
    start = time.perf_counter()
    qc = create_dj_circuit(n_qubits, truth_table)
    sim = AerSimulator()
    job = sim.run(qc, shots=shots)
    result = job.result()
    counts = result.get_counts(qc)
    exec_time = (time.perf_counter() - start) * 1000
    all_zero = set(counts.keys()) == {'0' * n_qubits}
    return {'result': 'CONSTANT' if all_zero else 'BALANCED', 'counts': counts, 'execution_time_ms': round(exec_time, 4), 'circuit_depth': qc.depth(), 'gate_count': len(qc.data), 'num_qubits': n_qubits + 1}

def run_classic_brute_force(n_qubits, truth_table):
    start = time.perf_counter()
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
    exec_time = (time.perf_counter() - start) * 1000
    num_evals = 1 if not all_same else (num_inputs // 2 + 1)
    return {'result': 'CONSTANT' if all_same else 'BALANCED', 'num_evaluations': num_evals, 'worst_case_evaluations': 2 ** (n_qubits - 1) + 1, 'execution_time_ms': round(exec_time, 4), 'time_complexity': f'O(2^{n_qubits - 1} + 1)'}

def generate_classic_pseudocode(case_id, n_qubits, steps):
    lines = []
    first_input = steps[0]['input']
    first_output = steps[0]['output']
    batas_uji = 2 ** (n_qubits - 1) + 1
    lines.append(f'Algoritma 4.1 Solusi Klasik Deutsch-Jozsa ({case_id})')
    lines.append(f'01: BACA N = {n_qubits}')
    lines.append(f'02: OUTPUT_AWAL <- f("{first_input}") = {first_output}')
    lines.append(f'03: BATAS_UJI <- 2^({n_qubits}-1) + 1 = {batas_uji}')
    if len(steps) <= 1:
        lines.append(f'04: TULIS "{steps[0]["output"]}"')
        return lines
    lines.append(f'04: FOR INDEKS <- 1 TO {len(steps) - 1}')
    for i, step in enumerate(steps[1:], start=1):
        if step['status'] == 'checked':
            lines.append(f'05: UJI indeks={i}: f("{step["input"]}") = {step["output"]} = OUTPUT_AWAL -> LANJUT')
        else:
            lines.append(f'05: UJI indeks={i}: f("{step["input"]}") = {step["output"]} = OUTPUT_AWAL')
            lines.append(f'06: KARENA {step["output"]} =/= OUTPUT_AWAL')
            lines.append('07: TULIS "BALANCED"')
            lines.append('08: BERHENTI')
            return lines
    lines.append('05: END FOR')
    lines.append('06: TULIS "CONSTANT"')
    return lines

def generate_quantum_pseudocode(case_id, n_qubits, stages):
    lines = []
    lines.append(f'Algoritma 4.2 Solusi Kuantum Deutsch-Jozsa ({case_id})')
    lines.append(f'01: BACA N = {n_qubits}')
    lines.append('02: BACA ancilla = 1')
    step = 0
    for stage in stages:
        step += 1
        op = stage['operation']
        phase = stage['phase']
        if phase == 'init' and step == 1:
            lines.append('03: X(anc)')
            lines.append(f'04: H(q0..q{n_qubits - 1})')
        elif phase == 'prep' and step == 2:
            lines.append('05: H(anc)')
        elif phase == 'oracle':
            if op.startswith('Flip'):
                bits = op.split()[-1]
                zero_idxs = [i for i, b in enumerate(bits) if b == '0']
                if zero_idxs:
                    qubits = ', '.join(f'q{i}' for i in zero_idxs)
                    lines.append(f'{step + 2:02d}: X({qubits}) [flip kontrol]')
            elif op.startswith('CNOT'):
                bits = op.split()[-1]
                one_idxs = [i for i, b in enumerate(bits) if b == '1']
                if one_idxs:
                    ctrl = ', '.join(f'q{i}' for i in one_idxs)
                    lines.append(f'{step + 2:02d}: CNOT({ctrl} → anc) [uji holistik]')
            elif op.startswith('Restore'):
                bits = op.split()[-1]
                zero_idxs = [i for i, b in enumerate(bits) if b == '0']
                if zero_idxs:
                    qubits = ', '.join(f'q{i}' for i in zero_idxs)
                    lines.append(f'{step + 2:02d}: X({qubits}) [pulih kontrol]')
        elif phase == 'interference':
            lines.append(f'{step + 2:02d}: H(q0..q{n_qubits - 1})')
        elif phase == 'measure':
            q = op.split()[-1] if op else 'q0'
            lines.append(f'{step + 2:02d}: UKUR {q} → bit klasik')
    lines.append(f'{step + 3:02d}: HASIL ← bit klasik')
    lines.append(f'{step + 4:02d}: JIKA semua 0 → CONSTANT')
    lines.append(f'{step + 5:02d}: JIKA bukan 0 → BALANCED')
    return lines

def run_classic_brute_force_stepped(n_qubits, truth_table, case_id):
    steps = []
    max_evals = 2 ** (n_qubits - 1) + 1
    first_input = format(0, f'0{n_qubits}b')
    first_output = truth_table.get(first_input, 0)
    steps.append({'index': 0, 'input': first_input, 'output': first_output, 'status': 'checked'})
    result = 'CONSTANT'
    for i in range(1, max_evals):
        input_bin = format(i, f'0{n_qubits}b')
        output = truth_table.get(input_bin, 0)
        if output != first_output:
            steps.append({'index': i, 'input': input_bin, 'output': output, 'status': 'differs'})
            result = 'BALANCED'
            break
        else:
            steps.append({'index': i, 'input': input_bin, 'output': output, 'status': 'checked'})
    pseudocode = generate_classic_pseudocode(case_id, n_qubits, steps)
    return {'case_id': case_id, 'n_qubits': n_qubits, 'classification': result, 'steps': steps, 'pseudocode': pseudocode}

def get_dj_circuit_payload(n_qubits):
    truth_table = {format(i, f'0{n_qubits}b'): 0 for i in range(2 ** n_qubits)}
    qc = create_dj_circuit(n_qubits, truth_table)
    gates = [{'name': instr.name, 'qubits': [qargs[i].index for i in range(len(qargs))], 'params': getattr(instr, 'params', [])} for instr, qargs, _ in qc.data]
    return {'n_qubits': n_qubits, 'depth': qc.depth(), 'gate_count': len(qc.data), 'gates': gates}

def get_dj_circuit_image_payload(case_id, boxed=False):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    qc = create_dj_circuit(n_qubits, truth_table)
    try:
        fig = circuit_drawer(qc, output='mpl')
        if boxed:
            fig = add_phase_boxes_to_figure(fig, qc)
        return {'case_id': case_id, 'n_qubits': n_qubits, 'image': figure_to_base64(fig), 'depth': qc.depth(), 'gate_count': len(qc.data)}
    except Exception as e:
        msg = 'Failed to generate boxed circuit' if boxed else 'Failed to generate circuit'
        return {'error': f'{msg}: {str(e)}'}

def run_dj_benchmark_payload(case_id, shots):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    quantum = run_quantum_dj(n_qubits, truth_table, shots)
    classic = run_classic_brute_force(n_qubits, truth_table)
    quantum_correct = quantum['result'] == case['expected_classification']
    classic_correct = classic['result'] == case['expected_classification']
    return {'case_id': case_id, 'n_qubits': n_qubits, 'expected_classification': case['expected_classification'], 'shots': shots, 'quantum': quantum, 'classic': classic, 'accuracy': {'quantum_correct': quantum_correct, 'classic_correct': classic_correct}, 'comparison': {'quantum_calls': 1, 'classic_calls': classic['num_evaluations'], 'speedup_factor': classic['num_evaluations'] if classic['num_evaluations'] > 0 else 1}}

def get_dj_classic_trace_payload(case_id):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    return run_classic_brute_force_stepped(n_qubits=case['n_qubits'], truth_table=case['oracle_definition']['truth_table'], case_id=case_id)

def get_dj_quantum_trace_payload(case_id):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    stages = build_trace_from_truth_table(n_qubits, truth_table)
    pseudocode = generate_quantum_pseudocode(case_id, n_qubits, stages)
    return {'case_id': case_id, 'n_qubits': n_qubits, 'classification': case['expected_classification'], 'stages': stages, 'pseudocode': pseudocode}

def get_dj_quantum_trace_grouped_payload(case_id):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    stages = build_trace_from_truth_table(n_qubits, truth_table)
    partitions = partition_stage_groups(stages)
    pseudocode = generate_quantum_pseudocode(case_id, n_qubits, stages)
    return {'case_id': case_id, 'n_qubits': n_qubits, 'classification': case['expected_classification'], 'partitions': partitions, 'stages': stages, 'pseudocode': pseudocode}


def _build_anim_circuit_no_measure(n_qubits, truth_table):
    qr_in = QuantumRegister(n_qubits, 'q')
    qr_anc = QuantumRegister(1, 'anc')
    total = n_qubits + 1
    labels = [format(i, f'0{total}b') for i in range(2 ** total)]
    snapshots = []

    init_sv = Statevector.from_label('0' * total)
    snapshots.append({
        'phase': 'init',
        'operation': 'Initial state |0...0⟩',
        'description': '{} input qubits + 1 ancilla, semua |0⟩'.format(n_qubits),
        'probabilities': [float(abs(v) ** 2) for v in init_sv.data],
        'labels': labels,
    })

    qc = QuantumCircuit(qr_in, qr_anc)
    snapshots.append({
        'phase': 'init',
        'operation': 'X on ancilla',
        'description': 'Set ancilla ke |1⟩ untuk phase kickback',
        'probabilities': [float(abs(v) ** 2) for v in init_sv.data],
        'labels': labels,
    })

    qc.x(qr_anc[0])
    sv = Statevector.from_instruction(qc)
    snapshots.append({
        'phase': 'init',
        'operation': 'After X(anc)',
        'description': 'Ancilla sekarang |1⟩, input masih |0⟩',
        'probabilities': [float(abs(v) ** 2) for v in sv.data],
        'labels': labels,
    })

    qc.h(qr_in[:])
    qc.h(qr_anc[0])
    sv = Statevector.from_instruction(qc)
    snapshots.append({
        'phase': 'prep',
        'operation': 'H on all qubits',
        'description': 'Superposisi: H pada semua input + ancilla → |+⟩...|+⟩|−⟩',
        'probabilities': [float(abs(v) ** 2) for v in sv.data],
        'labels': labels,
    })

    profile = truth_table_profile(truth_table)
    if profile['is_constant_zero']:
        snapshots.append({
            'phase': 'oracle',
            'operation': 'Oracle: Identity (f(x)=0)',
            'description': 'Oracle constant-0: tidak ada operasi, state tidak berubah',
            'probabilities': [float(abs(v) ** 2) for v in sv.data],
            'labels': labels,
        })
    elif profile['is_constant_one']:
        qc.x(qr_anc[0])
        sv = Statevector.from_instruction(qc)
        snapshots.append({
            'phase': 'oracle',
            'operation': 'Oracle: X on ancilla (f(x)=1)',
            'description': 'Oracle constant-1: X pada ancilla, semua output sama',
            'probabilities': [float(abs(v) ** 2) for v in sv.data],
            'labels': labels,
        })
    else:
        for input_bits in sorted(truth_table):
            if truth_table[input_bits] != 1:
                continue
            zero_indices = [idx for idx, bit in enumerate(input_bits) if bit == '0']

            for idx in zero_indices:
                qc.x(qr_in[idx])
            sv = Statevector.from_instruction(qc)
            snapshots.append({
                'phase': 'oracle',
                'operation': 'Oracle: X flip for {}'.format(input_bits),
                'description': 'Flip qubit {} agar kontrol semuanya |1⟩'.format(
                    ' '.join('q{}'.format(i) for i in zero_indices)) if zero_indices else 'Tidak perlu flip',
                'probabilities': [float(abs(v) ** 2) for v in sv.data],
                'labels': labels,
            })

            qc.mcx(list(qr_in), qr_anc[0])
            sv = Statevector.from_instruction(qc)
            snapshots.append({
                'phase': 'oracle',
                'operation': 'Oracle: MCX for {} → anc'.format(input_bits),
                'description': 'Multi-control-X: evaluasi f({})=1 via phase kickback'.format(input_bits),
                'probabilities': [float(abs(v) ** 2) for v in sv.data],
                'labels': labels,
            })

            for idx in zero_indices:
                qc.x(qr_in[idx])
            sv = Statevector.from_instruction(qc)
            snapshots.append({
                'phase': 'oracle',
                'operation': 'Oracle: X restore for {}'.format(input_bits),
                'description': 'Pulihkan qubit kontrol ke state semula',
                'probabilities': [float(abs(v) ** 2) for v in sv.data],
                'labels': labels,
            })

    qc.h(qr_in[:])
    sv = Statevector.from_instruction(qc)
    snapshots.append({
        'phase': 'interference',
        'operation': 'H on input qubits (interference)',
        'description': 'Hadamard akhir: interferensi konstruktif (CONSTANT) atau destruktif (BALANCED)',
        'probabilities': [float(abs(v) ** 2) for v in sv.data],
        'labels': labels,
    })

    input_probs = {}
    for i in range(2 ** total):
        bits = format(i, f'0{total}b')
        input_bits = bits[:n_qubits]
        prob = abs(sv.data[i]) ** 2
        input_probs[input_bits] = input_probs.get(input_bits, 0.0) + prob

    return snapshots, input_probs


def get_dj_animation_payload(case_id, shots=1024):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']

    snapshots, input_probs = _build_anim_circuit_no_measure(n_qubits, truth_table)

    quantum_result = run_quantum_dj(n_qubits, truth_table, shots)

    truth_table_entries = []
    for bits in sorted(truth_table):
        truth_table_entries.append({
            'input': bits,
            'output': truth_table[bits],
        })

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'total_qubits': n_qubits + 1,
        'expected_classification': case['expected_classification'],
        'truth_table': truth_table_entries,
        'snapshots': snapshots,
        'measurement': {
            'counts': quantum_result['counts'],
            'classification': quantum_result['result'],
            'shots': shots,
        },
        'input_probabilities': [{'input_bits': k, 'probability': round(v, 6)} for k, v in sorted(input_probs.items())],
    }
