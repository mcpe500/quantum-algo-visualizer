import matplotlib
matplotlib.use('Agg')

import math
import time
import numpy as np
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator
from qiskit.visualization import circuit_drawer

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

    from qiskit.circuit.library import Initialize
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
