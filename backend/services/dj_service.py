import matplotlib
matplotlib.use('Agg')
import math
import time
from datetime import datetime
import numpy as np
import matplotlib.pyplot as plt
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
    pre_init_markers = {i: '-' for i in range(n_qubits)}
    pre_init_markers[anc_idx] = '-'
    append_stage('Init |0⟩', pre_init_markers, 'pre-init')
    append_stage('X H H', col0_markers, 'init')
    col1_markers = {i: '-' for i in range(n_qubits)}
    col1_markers[anc_idx] = 'H'
    append_stage('H (anc)', col1_markers, 'prep')
    if profile['is_constant_zero']:
        oracle_markers = {i: '-' for i in range(n_qubits)}
        oracle_markers[anc_idx] = '-'
        append_stage('Oracle I', oracle_markers, 'oracle')
    elif profile['is_constant_one']:
        oracle_markers = {i: '-' for i in range(n_qubits)}
        oracle_markers[anc_idx] = 'X'
        append_stage('Oracle X(anc)', oracle_markers, 'oracle')
    elif profile['is_balanced']:
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


def _statevector_probabilities(statevector):
    return [float(abs(value) ** 2) for value in statevector.data]


def _compute_bloch_from_statevector(statevector_data, total_qubits, qubit_idx):
    """Compute Bloch vector for a single qubit from full multi-qubit statevector.

    Args:
        statevector_data: list of complex amplitudes from Statevector.data
        total_qubits: total number of qubits (input + ancilla)
        qubit_idx: index of qubit to compute (0..total_qubits-1)

    Returns:
        dict with theta, phi, bx, by, bz, and human-readable label
    """
    N = total_qubits
    statevec = np.array(statevector_data, dtype=complex)
    statevec = statevec.reshape([2] * N)

    # Qiskit statevector uses little-endian qubit indexing:
    # - qubit 0 is the least-significant bit (last tensor axis)
    # - qubit N-1 is the most-significant bit (first tensor axis)
    # We receive qubit_idx in circuit order (q0..q{n-1}, anc), so map
    # to the corresponding tensor axis explicitly.
    axis = N - 1 - qubit_idx

    rho_i = np.zeros((2, 2), dtype=complex)
    for a in range(2):
        for b in range(2):
            idx_a = [slice(0, 2)] * N
            idx_b = [slice(0, 2)] * N
            idx_a[axis] = a
            idx_b[axis] = b
            rho_i[a, b] = np.sum(statevec[tuple(idx_a)] * np.conj(statevec[tuple(idx_b)]))

    rho00 = float(np.real(rho_i[0, 0]))
    rho11 = float(np.real(rho_i[1, 1]))
    rho01 = rho_i[0, 1]
    rho10 = rho_i[1, 0]

    bz = rho00 - rho11
    bx = 2.0 * float(np.real(rho01))
    by = 2.0 * float(np.imag(rho01))

    norm = math.sqrt(bx * bx + by * by + bz * bz)
    if norm > 1e-8:
        bx = bx / norm
        by = by / norm
        bz = bz / norm

    theta = 2.0 * math.acos(max(-1.0, min(1.0, bz)))
    phi = math.atan2(by, bx)

    bx_val = float(np.clip(bx, -1.0, 1.0))
    by_val = float(np.clip(by, -1.0, 1.0))
    bz_val = float(np.clip(bz, -1.0, 1.0))

    if abs(bz_val - 1.0) < 0.05:
        label = '|0⟩'
    elif abs(bz_val + 1.0) < 0.05:
        label = '|1⟩'
    elif abs(bx_val - 1.0) < 0.05:
        label = '|+⟩'
    elif abs(bx_val + 1.0) < 0.05:
        label = '|−⟩'
    elif abs(by_val - 1.0) < 0.05:
        label = '|+i⟩'
    elif abs(by_val + 1.0) < 0.05:
        label = '|−i⟩'
    elif abs(theta - math.pi / 2) < 0.2:
        label = '0|1'
    else:
        label = 'ψ'

    return {
        'qubit': qubit_idx,
        'theta': float(theta),
        'phi': float(phi),
        'bx': bx_val,
        'by': by_val,
        'bz': bz_val,
        'label': label,
    }


def _extract_input_bits(operation):
    suffix = operation.split()[-1] if operation else ''
    return suffix if suffix and set(suffix).issubset({'0', '1'}) else None


def _describe_animation_stage(stage, n_qubits):
    phase = stage['phase']
    operation = stage['operation']
    focus_bits = _extract_input_bits(operation)

    if phase == 'pre-init':
        return 'Semua qubit dimulai dari keadaan dasar |0⟩ sebelum operasi apapun diterapkan.'
    if phase == 'init':
        return 'Ancilla diubah ke |1⟩ dan semua qubit input diberi Hadamard agar register awal siap membentuk superposisi.'
    if phase == 'prep':
        return 'Hadamard pada ancilla membentuk |−⟩ sehingga oracle dapat menuliskan jawaban sebagai phase kickback.'
    if phase == 'oracle' and operation == 'Oracle I':
        return 'Kasus constant-zero. Oracle tidak memberi transformasi tambahan sehingga semua input tetap diperlakukan sama.'
    if phase == 'oracle' and operation == 'Oracle X(anc)':
        return 'Kasus constant-one. Oracle nyata cukup berupa X pada ancilla karena semua input menghasilkan keluaran 1.'
    if phase == 'oracle' and operation.startswith('Flip') and focus_bits:
        zeros = [f'q{idx}' for idx, bit in enumerate(focus_bits) if bit == '0']
        if zeros:
            return 'Qubit kontrol bernilai 0 dibalik sementara pada {} agar pola {} dapat dipetakan ke kondisi semua kontrol = 1.'.format(', '.join(zeros), focus_bits)
        return 'Tidak ada pembalikan kontrol tambahan karena pola {} sudah semua 1.'.format(focus_bits)
    if phase == 'oracle' and operation.startswith('CNOT') and focus_bits:
        return 'MCX aktif untuk pola {}. Inilah evaluasi oracle nyata yang berasal langsung dari truth table dataset.'.format(focus_bits)
    if phase == 'oracle' and operation.startswith('Restore') and focus_bits:
        return 'Qubit kontrol dipulihkan setelah evaluasi pola {} agar sirkuit kembali ke basis semula sebelum kolom berikutnya.'.format(focus_bits)
    if phase == 'interference':
        return 'Hadamard akhir pada {} qubit input mengubah perbedaan fase menjadi pola amplitudo yang bisa dibaca saat pengukuran.'.format(n_qubits)
    if phase == 'measure':
        return 'Register input diukur. Jika semua hasil 0 maka fungsi CONSTANT, jika ada bit non-zero maka fungsi BALANCED.'
    return 'Tahap sirkuit Deutsch-Jozsa yang dihitung dari dataset dan trace aktual.'


def _get_step_comment(kind, focus_bits=None):
    table = {
        'pre-init': 'Keadaan awal |0\u27E9',
        'init-register': 'Ancilla \u2192 |1\u27E9, input \u2192 superposisi',
        'prep-ancilla': 'Ancilla \u2192 |\u2212\u27E9 untuk phase kickback',
        'oracle-identity': 'Oracle constant: tidak ada operasi',
        'oracle-constant-one': 'Oracle constant: flip ancilla',
        'oracle-flip': 'Balik kontrol agar cocok',
        'oracle-mcx': f'MCX: evaluasi f({focus_bits})' if focus_bits else 'MCX: evaluasi oracle',
        'oracle-restore': 'Pulihkan kontrol ke semula',
        'interference': 'H akhir: fase \u2192 amplitudo',
        'measure': 'Ukur input \u2192 baca klasifikasi',
    }
    return table.get(kind, f'Tahap {kind}')


def _build_animation_timeline(n_qubits, truth_table, stages):
    qr_in = QuantumRegister(n_qubits, 'q')
    qr_anc = QuantumRegister(1, 'anc')
    qc = QuantumCircuit(qr_in, qr_anc)
    total_qubits = n_qubits + 1
    labels = [format(i, f'0{total_qubits}b') for i in range(2 ** total_qubits)]
    timeline = []

    for stage in stages:
        phase = stage['phase']
        operation = stage['operation']
        focus_bits = _extract_input_bits(operation)
        kind = phase

        if phase == 'pre-init':
            kind = 'pre-init'
        elif phase == 'init' and operation == 'X H H':
            qc.x(qr_anc[0])
            qc.h(qr_in[:])
            kind = 'init-register'
        elif phase == 'prep' and operation == 'H (anc)':
            qc.h(qr_anc[0])
            kind = 'prep-ancilla'
        elif phase == 'oracle' and operation == 'Oracle I':
            kind = 'oracle-identity'
        elif phase == 'oracle' and operation == 'Oracle X(anc)':
            qc.x(qr_anc[0])
            kind = 'oracle-constant-one'
        elif phase == 'oracle' and operation.startswith('Flip') and focus_bits:
            for idx, bit in enumerate(focus_bits):
                if bit == '0':
                    qc.x(qr_in[idx])
            kind = 'oracle-flip'
        elif phase == 'oracle' and operation.startswith('CNOT') and focus_bits:
            qc.mcx(list(qr_in), qr_anc[0])
            kind = 'oracle-mcx'
        elif phase == 'oracle' and operation.startswith('Restore') and focus_bits:
            for idx, bit in enumerate(focus_bits):
                if bit == '0':
                    qc.x(qr_in[idx])
            kind = 'oracle-restore'
        elif phase == 'interference' and operation == 'H (final)':
            qc.h(qr_in[:])
            kind = 'interference'
        elif phase == 'measure':
            kind = 'measure'

        statevector = Statevector.from_instruction(qc)
        sv_data = statevector.data

        bloch_states = []
        for qubit_idx in range(total_qubits):
            bs = _compute_bloch_from_statevector(sv_data, total_qubits, qubit_idx)
            bloch_states.append(bs)

        timeline.append({
            'step': stage['step'],
            'phase': phase,
            'kind': kind,
            'operation': operation,
            'description': _describe_animation_stage(stage, n_qubits),
            'comment': _get_step_comment(kind, focus_bits),
            'wire_markers': stage['wire_markers'],
            'ancilla_marker': stage['ancilla_marker'],
            'focus_input_bits': focus_bits,
            'probabilities': _statevector_probabilities(statevector),
            'labels': labels,
            'bloch_states': bloch_states,
        })

    final_probs = timeline[-1]['probabilities'] if timeline else _statevector_probabilities(Statevector.from_label('0' * total_qubits))
    input_probabilities = {}
    for index, probability in enumerate(final_probs):
        bits = format(index, f'0{total_qubits}b')
        input_bits = bits[:n_qubits]
        input_probabilities[input_bits] = input_probabilities.get(input_bits, 0.0) + probability

    return timeline, input_probabilities

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
            if op == 'Oracle I':
                lines.append(f'{step + 2:02d}: ORACLE identitas [semua f(x)=0]')
            elif op == 'Oracle X(anc)':
                lines.append(f'{step + 2:02d}: X(anc) [semua f(x)=1]')
            elif op.startswith('Flip'):
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

    def _render_text_circuit(qc_obj):
        text_diagram = qc_obj.draw(output='text').single_string()
        lines = text_diagram.splitlines() or ['']
        longest = max(len(line) for line in lines)
        fig_width = max(9.0, min(28.0, longest * 0.12))
        fig_height = max(2.6, min(24.0, len(lines) * 0.30 + 1.2))
        fig, ax = plt.subplots(figsize=(fig_width, fig_height))
        ax.axis('off')
        ax.text(
            0.01,
            0.99,
            text_diagram,
            transform=ax.transAxes,
            ha='left',
            va='top',
            fontfamily='monospace',
            fontsize=10,
            color='#111827',
        )
        fig.tight_layout(pad=0.6)
        return fig

    try:
        render_mode = 'mpl'
        warning = None
        try:
            fig = circuit_drawer(qc, output='mpl')
        except Exception as draw_error:
            fig = _render_text_circuit(qc)
            render_mode = 'text-fallback'
            warning = f'MPL drawer unavailable, using text fallback: {str(draw_error)}'

        if boxed and render_mode == 'mpl':
            try:
                fig = add_phase_boxes_to_figure(fig, qc)
            except Exception as boxed_error:
                warning = f'Phase box overlay failed: {str(boxed_error)}'

        try:
            image_base64 = figure_to_base64(fig)
        except Exception as save_error:
            if render_mode != 'text-fallback':
                try:
                    plt.close(fig)
                except Exception:
                    pass
                fig = _render_text_circuit(qc)
                render_mode = 'text-fallback'
                existing_warning = f'{warning} | ' if warning else ''
                warning = f'{existing_warning}MPL save failed, using text fallback: {str(save_error)}'
                image_base64 = figure_to_base64(fig)
            else:
                raise

        payload = {
            'case_id': case_id,
            'n_qubits': n_qubits,
            'image': image_base64,
            'depth': qc.depth(),
            'gate_count': len(qc.data),
            'render_mode': render_mode,
        }
        if warning:
            payload['warning'] = warning
        return payload
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


def get_dj_animation_payload(case_id, shots=1024):
    case = get_dj_case_or_none(case_id)
    if not case:
        return None
    n_qubits = case['n_qubits']
    truth_table = case['oracle_definition']['truth_table']
    stages = build_trace_from_truth_table(n_qubits, truth_table)
    partitions = partition_stage_groups(stages)
    timeline, input_probs = _build_animation_timeline(n_qubits, truth_table, stages)

    quantum_result = run_quantum_dj(n_qubits, truth_table, shots)
    profile = truth_table_profile(truth_table)

    truth_table_entries = []
    for bits in sorted(truth_table):
        truth_table_entries.append({
            'input': bits,
            'output': truth_table[bits],
        })

    snapshots = [
        {
            'phase': step['phase'],
            'operation': step['operation'],
            'description': step['description'],
            'probabilities': step['probabilities'],
            'labels': step['labels'],
        }
        for step in timeline
    ]

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'total_qubits': n_qubits + 1,
        'expected_classification': case['expected_classification'],
        'truth_table': truth_table_entries,
        'oracle_summary': {
            'profile': 'constant-zero' if profile['is_constant_zero'] else 'constant-one' if profile['is_constant_one'] else 'balanced',
            'total_inputs': profile['total'],
            'ones_count': profile['num_ones'],
            'zeros_count': profile['total'] - profile['num_ones'],
        },
        'partitions': partitions,
        'timeline': timeline,
        'snapshots': snapshots,
        'measurement': {
            'counts': quantum_result['counts'],
            'classification': quantum_result['result'],
            'shots': shots,
        },
        'input_probabilities': [{'input_bits': k, 'probability': round(v, 6)} for k, v in sorted(input_probs.items())],
    }
