import matplotlib
matplotlib.use('Agg')

import math
import time
import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit.library import Initialize
from qiskit_aer import AerSimulator
from qiskit.visualization import circuit_drawer
from qiskit.quantum_info import DensityMatrix, Statevector, partial_trace

from api.shared.plotting import figure_to_base64
from services.common import list_cases, load_case


def get_qft_case_or_none(case_id):
    return load_case('qft', case_id)


def get_qft_cases():
    return list_cases('qft', 'QFT-')


def _qubit_index(qubit):
    if hasattr(qubit, 'index'):
        return int(qubit.index)
    if hasattr(qubit, '_index'):
        return int(qubit._index)
    return 0


def next_power_of_2(value):
    n = int(value)
    if n <= 1:
        return 1
    return 1 << (n - 1).bit_length()


def pad_signal(signal_data, target_length):
    values = [float(v) for v in signal_data]
    if len(values) >= target_length:
        return values[:target_length]
    return values + [0.0] * (target_length - len(values))


def _resolve_signal(case):
    raw = case.get('signal_data', []) or []
    signal = [float(v) for v in raw]

    declared = case.get('n_points', len(signal) if signal else 1)
    try:
        declared_points = int(declared)
    except (TypeError, ValueError):
        declared_points = len(signal) if signal else 1

    declared_points = max(1, declared_points)
    n_original = len(signal) if len(signal) > 0 else declared_points
    if n_original != declared_points:
        raise ValueError(
            f'QFT case metadata mismatch: n_points={declared_points} but signal_data has {n_original} values.'
        )
    signal = pad_signal(signal, n_original)
    n_padded = next_power_of_2(n_original)
    padded = pad_signal(signal, n_padded)
    n_qubits = int(math.log2(n_padded))

    return {
        'signal': signal,
        'padded_signal': padded,
        'n_points_original': n_original,
        'n_points_padded': n_padded,
        'n_qubits': n_qubits,
    }


def _apply_qft_layers(qc, qr, n_qubits):
    for j in range(n_qubits - 1, -1, -1):
        for k in range(n_qubits - 1, j, -1):
            angle = math.pi / (2 ** (k - j))
            qc.cp(angle, qr[k], qr[j])
        qc.h(qr[j])

    for i in range(n_qubits // 2):
        qc.swap(qr[i], qr[n_qubits - 1 - i])


def create_qft_circuit(n_qubits):
    qr = QuantumRegister(n_qubits, 'q')
    cr = ClassicalRegister(n_qubits, 'c')
    qc = QuantumCircuit(qr, cr, name=f'QFT_n{n_qubits}')

    _apply_qft_layers(qc, qr, n_qubits)

    qc.measure(qr, cr)
    return qc


def run_fft_full(signal_data):
    started = time.perf_counter()

    array = np.array(signal_data, dtype=float)
    n_points = len(array)
    fft_result = np.fft.fft(array)
    magnitude = np.abs(fft_result)
    phase = np.angle(fft_result)

    spectrum = [
        {'bin': int(i), 'magnitude': float(magnitude[i]), 'phase': float(phase[i])}
        for i in range(n_points)
    ]

    top_count = min(4, len(magnitude))
    top_indices = np.argsort(magnitude)[::-1][:top_count]
    dominant_bins = [int(idx) for idx in top_indices]
    dominant_magnitudes = [float(magnitude[idx]) for idx in top_indices]

    normalized = _normalize_amplitudes(array.tolist())
    normalized_fft = np.fft.fft(normalized)
    normalized_power = (np.abs(normalized_fft) ** 2) / max(1, n_points)
    normalized_power_spectrum = [
        {'bin': int(i), 'power': float(normalized_power[i])}
        for i in range(n_points)
    ]
    normalized_top_indices = np.argsort(normalized_power)[::-1][:top_count]
    normalized_power_dominant_bins = [int(idx) for idx in normalized_top_indices]
    normalized_power_dominant_values = [float(normalized_power[idx]) for idx in normalized_top_indices]

    runtime_ms = (time.perf_counter() - started) * 1000.0

    return {
        'dominant_bins': dominant_bins,
        'dominant_magnitudes': dominant_magnitudes,
        'execution_time_ms': round(runtime_ms, 4),
        'n_points': n_points,
        'time_complexity': f'O({n_points} log {n_points})',
        'spectrum': spectrum,
        'normalized_power_spectrum': normalized_power_spectrum,
        'normalized_power_dominant_bins': normalized_power_dominant_bins,
        'normalized_power_dominant_values': normalized_power_dominant_values,
        'normalization_note': 'Fair comparison metric uses |FFT(x/||x||)|^2 / N.',
    }


def _normalize_amplitudes(signal_data):
    amplitudes = np.array(signal_data, dtype=float)
    norm = np.linalg.norm(amplitudes)
    if norm <= 0:
        state = np.zeros(len(amplitudes), dtype=float)
        state[0] = 1.0
        return state
    return amplitudes / norm


def _statevector_probabilities(statevector):
    sv = statevector.data if hasattr(statevector, 'data') else statevector
    return [float(abs(value) ** 2) for value in sv]


def _state_labels(n_qubits):
    return [f'|{index:0{n_qubits}b}>' for index in range(2 ** n_qubits)]


def _label_from_qubit_summary(x, y, z, radius):
    if abs(z - 1.0) < 0.08:
        return '|0>'
    if abs(z + 1.0) < 0.08:
        return '|1>'
    if radius < 0.35:
        return 'mixed'
    if abs(x - 1.0) < 0.08:
        return '|+>'
    if abs(x + 1.0) < 0.08:
        return '|->'
    if abs(y - 1.0) < 0.08:
        return '|+i>'
    if abs(y + 1.0) < 0.08:
        return '|-i>'
    return '|psi>'


def _phase_to_color(phase):
    hue = int((((phase + math.pi) / (2 * math.pi)) * 360) % 360)
    return f'hsl({hue}, 70%, 55%)'


def _extract_qubit_summaries(statevector, n_qubits):
    density = DensityMatrix(statevector)
    qubit_summaries = []

    for qubit in range(n_qubits):
        traced = [index for index in range(n_qubits) if index != qubit]
        reduced = partial_trace(density, traced).data if traced else density.data
        p_zero = float(np.real(reduced[0, 0]))
        p_one = float(np.real(reduced[1, 1]))
        coherence = reduced[0, 1]
        x = float(np.clip(2 * np.real(coherence), -1.0, 1.0))
        y = float(np.clip(2 * np.imag(coherence), -1.0, 1.0))
        z = float(np.clip(p_zero - p_one, -1.0, 1.0))
        radius = float(np.clip(math.sqrt((x * x) + (y * y) + (z * z)), 0.0, 1.0))
        phase = float(math.atan2(y, x)) if abs(x) > 1e-9 or abs(y) > 1e-9 else 0.0

        qubit_summaries.append({
            'qubit': qubit,
            'p_zero': round(max(0.0, min(1.0, p_zero)), 6),
            'p_one': round(max(0.0, min(1.0, p_one)), 6),
            'bx': round(x, 6),
            'by': round(y, 6),
            'bz': round(z, 6),
            'radius': round(radius, 6),
            'coherence': round(radius, 6),
            'phase': round(phase, 6),
            'body_color': _phase_to_color(phase),
            'label': _label_from_qubit_summary(x, y, z, radius),
        })

    return qubit_summaries


def _extract_qubit_phases(statevector, n_qubits):
    """Extract accumulated phase angle φ untuk setiap qubit dari statevector.

    Untuk QFT, phase accumulation adalah kunci visualisasi. Kita estimasi phase
    per qubit dengan melihat how phase varies across states yang berbeda di
    posisi qubit tersebut.
    """
    phases = []
    sv = statevector.data if hasattr(statevector, 'data') else statevector
    n_states = len(sv)

    for qubit in range(n_qubits):
        phase_sum = 0.0
        count = 0
        bit_pos = n_qubits - 1 - qubit
        mask = 1 << bit_pos

        for i in range(n_states):
            j = i ^ mask
            if j > i and (i & mask) == 0 and (j & mask) == mask:
                a_i = sv[i]
                a_j = sv[j]
                if abs(a_i) > 1e-6 and abs(a_j) > 1e-6:
                    phase_diff = np.angle(a_j) - np.angle(a_i)
                    phase_sum += phase_diff
                    count += 1

        if count > 0:
            avg_phase = phase_sum / count
            phases.append(float(avg_phase))
        else:
            phases.append(0.0)

    return phases


def _sv_to_dict_list(sv):
    """Convert statevector to list of {re, im} dicts for JSON serialization."""
    return [{'re': round(c.real, 12), 'im': round(c.imag, 12)} for c in sv.data]


def _build_timeline_step(step, phase, operation, description, statevector, n_qubits, **extra):
    qubit_summaries = _extract_qubit_summaries(statevector, n_qubits)
    return {
        'step': int(step),
        'phase': phase,
        'operation': operation,
        'description': description,
        'statevector': _sv_to_dict_list(statevector),
        'qubit_summaries': qubit_summaries,
        'qubit_phases': [summary['phase'] for summary in qubit_summaries],
        'probabilities': _statevector_probabilities(statevector),
        'labels': _state_labels(n_qubits),
        **extra,
    }


def build_qft_animation_timeline(signal_data, n_qubits):
    """Build step-by-step timeline untuk QFT animation.
    
    Setiap step mencakup statevector snapshot dengan phase angles per qubit.
    Ini adalah inti dari QFT animation spec.
    """
    timeline = []
    steps_count = 0
    
    padded_signal = pad_signal(signal_data, 2 ** n_qubits)
    normalized = _normalize_amplitudes(padded_signal)
    
    sv = Statevector(normalized)

    timeline.append(_build_timeline_step(
        steps_count,
        'init',
        'Amplitude Encoding from Dataset',
        f'Amplitudo sinyal dari dataset dinormalisasi lalu di-encode ke state kuantum |psi> = sum_j a_j |j>. Semua nilai pada langkah ini langsung diturunkan dari {len(padded_signal)} sampel sinyal setelah padding.',
        sv,
        n_qubits,
    ))
    steps_count += 1

    for j in range(n_qubits - 1, -1, -1):
        for k in range(n_qubits - 1, j, -1):
            angle = math.pi / (2 ** (k - j))
            step_circuit = QuantumCircuit(n_qubits)
            step_circuit.cp(angle, k, j)
            sv = sv.evolve(step_circuit)
            timeline.append(_build_timeline_step(
                steps_count,
                'phase_cascade',
                f'CP({angle:.6f}) q{k}->q{j}',
                f'Controlled-phase dengan sudut {angle:.6f} rad menambahkan fase relatif pada q{j} ketika q{k} aktif. Urutan operasi ini identik dengan sirkuit QFT Qiskit yang dipakai untuk benchmark.',
                sv,
                n_qubits,
                target_qubit=j,
                control_qubit=k,
                rotation_angle=angle,
            ))
            steps_count += 1

        step_circuit = QuantumCircuit(n_qubits)
        step_circuit.h(j)
        sv = sv.evolve(step_circuit)
        timeline.append(_build_timeline_step(
            steps_count,
            'hadamard',
            f'H on qubit {j}',
            'Hadamard pada qubit target mengubah akumulasi fase menjadi pola interferensi yang dapat dibaca pada basis Fourier.',
            sv,
            n_qubits,
            target_qubit=j,
        ))
        steps_count += 1

    for i in range(n_qubits // 2):
        swap_pair = (i, n_qubits - 1 - i)
        step_circuit = QuantumCircuit(n_qubits)
        step_circuit.swap(*swap_pair)
        sv = sv.evolve(step_circuit)
        timeline.append(_build_timeline_step(
            steps_count,
            'swap',
            f'SWAP qubit {swap_pair[0]} <-> qubit {swap_pair[1]}',
            'SWAP network mengoreksi urutan bit-reversed sehingga state akhir dapat dibaca sebagai indeks frekuensi natural.',
            sv,
            n_qubits,
            swap_pair=swap_pair,
        ))
        steps_count += 1

    timeline.append(_build_timeline_step(
        steps_count,
        'measurement',
        'Measure all qubits',
        'State akhir siap diukur dengan 1024 shots pada benchmark. Probabilitas ideal pada langkah ini menjadi referensi visual sebelum sampling measurement.',
        sv,
        n_qubits,
    ))
    return timeline
    
    timeline.append({
        'step': steps_count,
        'phase': 'init',
        'operation': 'Initialize Statevector',
        'description': f'Load {len(normalized)} signal amplitudes into quantum state |ψ⟩ = Σ aₖ|k⟩. Setiap amplitude sinyal aⱼ di-encode ke basis state |j⟩.',
        'statevector': _sv_to_dict_list(sv),
        'qubit_phases': [0.0] * n_qubits,
        'probabilities': [float(abs(c) ** 2) for c in sv.data],
        'labels': [f'|{i:0{n_qubits}b}⟩' for i in range(2 ** n_qubits)],
      })
    steps_count += 1
    
    for j in range(n_qubits - 1, -1, -1):
        for k in range(n_qubits - 1, j, -1):
            angle = math.pi / (2 ** (k - j))
            old_data = sv.data.copy()
            new_data = np.zeros_like(old_data)
            
            for state_idx in range(len(old_data)):
                if old_data[state_idx] != 0:
                    new_data[state_idx] = old_data[state_idx]
            
            for state_idx in range(len(old_data)):
                bit_k = (state_idx >> (n_qubits - 1 - k)) & 1
                bit_j = (state_idx >> (n_qubits - 1 - j)) & 1
                if bit_k == 1 and bit_j == 0:
                    new_state = state_idx ^ (1 << (n_qubits - 1 - j))
                    phase = np.exp(1j * angle)
                    new_data[new_state] = old_data[state_idx] * phase
            
            sv = Statevector(new_data)
            
            timeline.append({
                'step': steps_count,
                'phase': 'phase_cascade',
                'operation': f'CPHASE(π/{2 ** (k - j):.0f}) q{j}←q{k}',
                'description': f'Controlled rotation CR_{k-j+1} menambahkan phase 2π/2^{k-j} pada qubit target q{j} dikendalikan oleh q{k}. Ini adalah operasi inti QFT untuk akumulasi phase.',
                'target_qubit': j,
                'control_qubit': k,
                'rotation_angle': angle,
                'statevector': _sv_to_dict_list(sv),
                'qubit_phases': _extract_qubit_phases(sv, n_qubits),
                'probabilities': [float(abs(c) ** 2) for c in sv.data],
                'labels': [f'|{i:0{n_qubits}b}⟩' for i in range(2 ** n_qubits)],
            })
            steps_count += 1
    
    for j in range(n_qubits - 1, -1, -1):
        # Apply Hadamard using evolve with Hadamard operator
        h_matrix = np.array([[1, 1], [1, -1]]) / np.sqrt(2)
        sv = sv.evolve(Operator(h_matrix), [j])
        timeline.append({
            'step': steps_count,
            'phase': 'hadamard',
            'operation': f'H on qubit {j}',
            'description': 'Hadamard gate membuka superposisi untuk analisis frekuensi paralel. Qubit berputar 90° mengelilingi sumbu-Y, mengubah |0⟩ atau |1⟩ menjadi superposisi (|0⟩ + |1⟩)/√2.',
            'target_qubit': j,
            'statevector': _sv_to_dict_list(sv),
            'qubit_phases': _extract_qubit_phases(sv, n_qubits),
            'probabilities': [float(abs(c) ** 2) for c in sv.data],
            'labels': [f'|{i:0{n_qubits}b}⟩' for i in range(2 ** n_qubits)],
        })
        steps_count += 1

    for i in range(n_qubits // 2):
        # Apply SWAP using evolve with SWAP operator
        swap_matrix = np.array([[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]])
        sv = sv.evolve(Operator(swap_matrix), [i, n_qubits - 1 - i])
        timeline.append({
            'step': steps_count,
            'phase': 'swap',
            'operation': f'SWAP qubit {i} ↔ qubit {n_qubits - 1 - i}',
            'description': 'SWAP network mengkoreksi bit-reversed ordering. Output QFT secara alami dalam urutan bit-reversed; SWAP gates mengembalikannya ke urutan natural.',
            'swap_pair': (i, n_qubits - 1 - i),
            'statevector': _sv_to_dict_list(sv),
            'qubit_phases': _extract_qubit_phases(sv, n_qubits),
            'probabilities': [float(abs(c) ** 2) for c in sv.data],
            'labels': [f'|{i:0{n_qubits}b}⟩' for i in range(2 ** n_qubits)],
        })
        steps_count += 1

    timeline.append({
        'step': steps_count,
        'phase': 'measurement',
        'operation': 'Measure all qubits',
        'description': 'Pengukuran collapsing state ke basis komputasi, menghasilkan spektrum frekuensi. Setiap bin frekuensi berkorelasi dengan probabilitas pengukuran state binary yang sesuai.',
        'statevector': _sv_to_dict_list(sv),
        'qubit_phases': _extract_qubit_phases(sv, n_qubits),
        'probabilities': [float(abs(c) ** 2) for c in sv.data],
        'labels': [f'|{i:0{n_qubits}b}⟩' for i in range(2 ** n_qubits)],
    })
    
    return timeline


def _build_qft_animation_partitions(timeline):
    """Build partitions dari timeline steps berdasarkan phase."""
    partitions = []
    current_phase = None
    start_idx = 0
    
    for i, step in enumerate(timeline):
        if step['phase'] != current_phase:
            if current_phase is not None:
                partitions.append({
                    'phase': current_phase,
                    'label': current_phase.capitalize(),
                    'count': i - start_idx,
                    'start': start_idx,
                    'end': i,
                })
            current_phase = step['phase']
            start_idx = i
    
    if current_phase is not None:
        partitions.append({
            'phase': current_phase,
            'label': current_phase.capitalize(),
            'count': len(timeline) - start_idx,
            'start': start_idx,
            'end': len(timeline),
        })
    
    return partitions


def run_qft_from_signal(signal_data, shots=1024):
    started = time.perf_counter()

    n_original = len(signal_data)
    n_padded = next_power_of_2(n_original)
    padded_signal = pad_signal(signal_data, n_padded)
    n_qubits = int(math.log2(n_padded))

    normalized = _normalize_amplitudes(padded_signal)

    qr = QuantumRegister(n_qubits, 'q')
    cr = ClassicalRegister(n_qubits, 'c')
    qc = QuantumCircuit(qr, cr, name=f'QFT_n{n_qubits}_signal')

    qc.append(Initialize(normalized), qr)

    _apply_qft_layers(qc, qr, n_qubits)

    qc.measure(qr, cr)

    simulator = AerSimulator()
    result = simulator.run(qc, shots=int(shots)).result()
    counts = result.get_counts(qc)

    total = sum(counts.values())
    probabilities = []
    for state, count in counts.items():
        probability = float(count / total) if total > 0 else 0.0
        bin_index = int(state, 2)
        probabilities.append({
            'state': state,
            'bin': bin_index,
            'count': int(count),
            'probability': probability,
        })
    probabilities.sort(key=lambda item: item['probability'], reverse=True)
    dominant_entries = probabilities[:min(4, len(probabilities))]

    runtime_ms = (time.perf_counter() - started) * 1000.0

    return {
        'counts': counts,
        'execution_time_ms': round(runtime_ms, 4),
        'circuit_depth': int(qc.depth()),
        'gate_count': int(len(qc.data)),
        'num_qubits': n_qubits,
        'time_complexity': f'O({n_qubits}^2) gates',
        'n_points_original': n_original,
        'n_points_padded': n_padded,
        'input_amplitudes': [float(abs(a)) for a in normalized],
        'probabilities': probabilities[:8],
        'dominant_bins': [int(entry['bin']) for entry in dominant_entries],
        'dominant_probabilities': [float(entry['probability']) for entry in dominant_entries],
        'note': 'QFT uses amplitude encoding from the same signal.',
        'bitstring_mapping_note': 'Measurement bitstring is big-endian; bin = int(state, 2).',
    }


def build_qft_trace(n_qubits):
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

    for j in range(n_qubits - 1, -1, -1):
        for k in range(n_qubits - 1, j, -1):
            markers = {i: '-' for i in range(n_qubits)}
            markers[k] = '●'
            markers[j] = 'P'
            angle = math.pi / (2 ** (k - j))
            append_stage(f'CP({angle:.4f}) q{k}->q{j}', markers, 'transform')
        append_stage(
            f'H on q{j}',
            {i: ('H' if i == j else '-') for i in range(n_qubits)},
            'transform',
        )

    for i in range(n_qubits // 2):
        markers = {j: '-' for j in range(n_qubits)}
        markers[i] = 'S'
        markers[n_qubits - 1 - i] = 'S'
        append_stage(f'SWAP q{i}<->q{n_qubits - 1 - i}', markers, 'swap')

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


def run_qft_payload(case_id, shots):
    case = get_qft_case_or_none(case_id)
    if not case:
        return None

    context = _resolve_signal(case)
    signal = context['signal']
    padded = context['padded_signal']
    n_original = context['n_points_original']
    n_padded = context['n_points_padded']
    n_qubits = context['n_qubits']

    fft_result = run_fft_full(padded)
    qft_result = run_qft_from_signal(signal, int(shots))
    fft_peak_bins = fft_result.get('normalized_power_dominant_bins', [])
    qft_peak_bins = qft_result.get('dominant_bins', [])
    shared_peak_bins = [int(bin_value) for bin_value in qft_peak_bins if bin_value in fft_peak_bins]

    return {
        'case_id': case_id,
        'signal_type': case.get('signal_type', 'unknown'),
        'n_points_original': n_original,
        'n_points_padded': n_padded,
        'n_qubits': n_qubits,
        'shots': int(shots),
        'input_signal': signal,
        'padded_signal': padded,
        'fft': fft_result,
        'qft': qft_result,
        'comparison': {
            'fft_complexity': f'O({n_padded} log {n_padded})',
            'qft_complexity': f'O({n_qubits}^2) gates',
            'speedup_factor': 'Simulator runtime is not physical quantum speedup.',
            'note': 'FFT and QFT are run from the same dataset signal; compare peak bins, not raw values.',
            'fair_metric': '|FFT(x/||x||)|^2 / N versus QFT measurement probability.',
            'fft_peak_bins': fft_peak_bins,
            'qft_peak_bins': qft_peak_bins,
            'shared_peak_bins': shared_peak_bins,
        },
    }


def get_qft_circuit_payload(case_id):
    case = get_qft_case_or_none(case_id)
    if not case:
        return None

    context = _resolve_signal(case)
    n_qubits = context['n_qubits']

    qc = create_qft_circuit(n_qubits)
    gates = []
    for instr, qargs, _ in qc.data:
        gates.append({
            'name': instr.name,
            'qubits': [_qubit_index(q) for q in qargs],
            'params': [float(p) if hasattr(p, '__float__') else str(p) for p in getattr(instr, 'params', [])],
        })

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'n_points_original': context['n_points_original'],
        'n_points_padded': context['n_points_padded'],
        'depth': int(qc.depth()),
        'gate_count': int(len(qc.data)),
        'gates': gates,
    }


def get_qft_circuit_image_payload(case_id):
    case = get_qft_case_or_none(case_id)
    if not case:
        return None

    context = _resolve_signal(case)
    n_qubits = context['n_qubits']
    qc = create_qft_circuit(n_qubits)

    try:
        fig = circuit_drawer(qc, output='mpl')
        return {
            'case_id': case_id,
            'n_qubits': n_qubits,
            'n_points_original': context['n_points_original'],
            'n_points_padded': context['n_points_padded'],
            'image': figure_to_base64(fig),
            'depth': int(qc.depth()),
            'gate_count': int(len(qc.data)),
        }
    except Exception as exc:
        return {'error': f'Failed to generate circuit image: {exc}'}


def get_qft_trace_payload(case_id):
    case = get_qft_case_or_none(case_id)
    if not case:
        return None

    context = _resolve_signal(case)
    stages = build_qft_trace(context['n_qubits'])
    partitions = _build_partitions(stages)

    return {
        'case_id': case_id,
        'n_qubits': context['n_qubits'],
        'n_points_original': context['n_points_original'],
        'n_points_padded': context['n_points_padded'],
        'stages': stages,
        'partitions': partitions,
    }


def get_qft_classical_payload(case_id):
    case = get_qft_case_or_none(case_id)
    if not case:
        return None

    context = _resolve_signal(case)
    fft_result = run_fft_full(context['padded_signal'])

    return {
        'case_id': case_id,
        'signal_type': case.get('signal_type', 'unknown'),
        'n_points_original': context['n_points_original'],
        'n_points_padded': context['n_points_padded'],
        'input_signal': context['signal'],
        'padded_signal': context['padded_signal'],
        'fft': fft_result,
    }


def get_qft_animation_payload(case_id, shots=1024):
    """Build QFT animation payload dengan timeline step-by-step.
    
    Include timeline dengan statevector tracking, partitions untuk phase stepper,
    dan measurement results dari actual QFT circuit run.
    """
    case = get_qft_case_or_none(case_id)
    if not case:
        return None

    context = _resolve_signal(case)
    signal = context['signal']
    n_qubits = context['n_qubits']

    timeline = build_qft_animation_timeline(signal, n_qubits)
    partitions = _build_qft_animation_partitions(timeline)
    
    fft_result = run_fft_full(context['padded_signal'])
    qft_result = run_qft_from_signal(signal, int(shots))

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

    input_probs = {}
    probs = [float(abs(c) ** 2) for c in Statevector(_normalize_amplitudes(pad_signal(signal, 2 ** n_qubits))).data]
    for i, prob in enumerate(probs):
        input_probs[f'{i:0{n_qubits}b}'] = round(prob, 6)

    return {
        'case_id': case_id,
        'signal_type': case.get('signal_type', 'unknown'),
        'n_qubits': n_qubits,
        'n_points_original': context['n_points_original'],
        'n_points_padded': context['n_points_padded'],
        'input_signal': signal,
        'padded_signal': context['padded_signal'],
        'fft': fft_result,
        'qft': {
            'counts': qft_result['counts'],
            'probabilities': qft_result['probabilities'],
            'dominant_bins': qft_result['dominant_bins'],
            'dominant_probabilities': qft_result['dominant_probabilities'],
        },
        'partitions': partitions,
        'timeline': timeline,
        'snapshots': snapshots,
        'measurement': {
            'counts': qft_result['counts'],
            'shots': shots,
        },
        'input_probabilities': [{'input_bits': k, 'probability': v} for k, v in sorted(input_probs.items())],
    }
