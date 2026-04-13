import os
import json
import time
import io
import base64
import math
from datetime import datetime
from flask import jsonify, request

import matplotlib
matplotlib.use('Agg')

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit_aer import AerSimulator
from qiskit.visualization import circuit_drawer
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle
import numpy as np

from api import api_bp

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATASETS_DIR = os.path.join(BASE_DIR, 'datasets', 'qft')


def load_case(case_id):
    """Load a QFT case from local dataset JSON file."""
    file_path = os.path.join(DATASETS_DIR, f'{case_id}.json')
    if not os.path.exists(file_path):
        return None
    with open(file_path, 'r') as f:
        return json.load(f)


def _case_sort_key(case):
    case_id = case.get('case_id', '')
    try:
        return (0, int(case_id.split('-', 1)[1]))
    except (IndexError, ValueError, TypeError):
        return (1, case_id)


def get_all_cases():
    """Load all available QFT cases."""
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
        if not case_id.startswith('QFT-') or not case_id[4:].isdigit():
            continue

        case = load_case(case_id)
        if case:
            cases.append(case)

    cases.sort(key=_case_sort_key)
    return cases


def next_power_of_2(n):
    """Return the next power of 2 greater than or equal to n."""
    return 1 << (n - 1).bit_length()


def pad_signal(signal_data, target_length):
    """Pad signal with zeros to reach target length."""
    padded = list(signal_data)
    while len(padded) < target_length:
        padded.append(0.0)
    return padded


def create_qft_circuit(n_qubits):
    """
    Build Quantum Fourier Transform circuit.
    
    QFT applies Hadamard and controlled-phase rotations:
    - H on qubit j
    - CP(pi/2) from qubit j+1 to j
    - CP(pi/4) from qubit j+2 to j
    - etc.
    - SWAP gates at the end to reverse qubit order
    """
    qr = QuantumRegister(n_qubits, "q")
    cr = ClassicalRegister(n_qubits, "c")
    qc = QuantumCircuit(qr, cr, name=f"QFT_n{n_qubits}")
    
    # QFT core: H and controlled rotations
    for j in range(n_qubits):
        # Hadamard on qubit j
        qc.h(qr[j])
        
        # Controlled phase rotations
        for k in range(j + 1, n_qubits):
            # Control on qubit k, target on qubit j
            # Phase angle = pi / 2^(k-j)
            angle = math.pi / (2 ** (k - j))
            qc.cp(angle, qr[k], qr[j])
    
    # SWAP gates to reverse qubit order (bit reversal)
    for i in range(n_qubits // 2):
        qc.swap(qr[i], qr[n_qubits - 1 - i])
    
    # Measurement
    qc.measure(qr[:], cr[:])
    
    return qc


def run_fft_full(signal_data):
    """
    Run classical Fast Fourier Transform - FULL VERSION.
    Returns FFT result, chart data, and dominant frequency bins.
    """
    start_time = time.perf_counter()
    
    n = len(signal_data)
    
    # Compute FFT
    fft_result = np.fft.fft(np.array(signal_data, dtype=float))
    magnitude = np.abs(fft_result)
    phase = np.angle(fft_result)
    
    # Full spectrum for chart visualization
    # Only take first half (positive frequencies) for cleaner chart
    half_n = n // 2
    spectrum_for_chart = [
        {"bin": i, "magnitude": float(magnitude[i]), "phase": float(phase[i])}
        for i in range(half_n)
    ]
    
    # Get dominant bins (top 4)
    top_indices = np.argsort(magnitude)[::-1][:4]
    dominant_bins = [int(idx) for idx in top_indices]
    dominant_magnitudes = [float(magnitude[idx]) for idx in top_indices]
    
    end_time = time.perf_counter()
    execution_time = (end_time - start_time) * 1000
    
    return {
        'dominant_bins': dominant_bins,
        'dominant_magnitudes': dominant_magnitudes,
        'execution_time_ms': round(execution_time, 4),
        'n_points': n,
        'time_complexity': f"O({n} log {n})",
        'spectrum': spectrum_for_chart
    }


def run_qft_from_signal(signal_data, shots=1024):
    """
    Run Quantum Fourier Transform using the same signal data as FFT.
    Uses amplitude encoding to prepare the input state from the signal.
    Returns circuit info, execution metrics, and chart data.
    """
    start_time = time.perf_counter()
    
    n_original = len(signal_data)
    n_padded = next_power_of_2(n_original)
    padded_signal = pad_signal(signal_data, n_padded)
    n_qubits = int(math.log2(n_padded))
    
    # Normalize signal to get amplitude encoding
    signal_array = np.array(padded_signal, dtype=float)
    norm = np.linalg.norm(signal_array)
    if norm > 0:
        normalized_amplitudes = signal_array / norm
    else:
        normalized_amplitudes = signal_array
    
    # Verify normalization
    sum_sq = np.sum(np.abs(normalized_amplitudes) ** 2)
    if abs(sum_sq - 1.0) > 1e-6:
        # Re-normalize to ensure proper quantum state
        normalized_amplitudes = normalized_amplitudes / np.sqrt(sum_sq)
    
    # Create QFT circuit with amplitude encoding
    qr = QuantumRegister(n_qubits, "q")
    cr = ClassicalRegister(n_qubits, "c")
    qc = QuantumCircuit(qr, cr, name=f"QFT_n{n_qubits}_from_signal")
    
    # Initialize state with normalized amplitudes (amplitude encoding)
    # Use the full statevector initialization
    from qiskit.circuit.library import Initialize
    qc.append(Initialize(normalized_amplitudes), qr)
    
    # Apply QFT
    for j in range(n_qubits):
        qc.h(qr[j])
        for k in range(j + 1, n_qubits):
            angle = math.pi / (2 ** (k - j))
            qc.cp(angle, qr[k], qr[j])
    
    # SWAP gates
    for i in range(n_qubits // 2):
        qc.swap(qr[i], qr[n_qubits - 1 - i])
    
    # Measurement
    qc.measure(qr[:], cr[:])
    
    # Run simulation
    simulator = AerSimulator()
    job = simulator.run(qc, shots=shots)
    result = job.result()
    
    counts = result.get_counts(qc)
    
    # Convert counts to probabilities and prepare chart data
    total_shots = sum(counts.values())
    probabilities = {}
    for state, cnt in counts.items():
        probabilities[state] = cnt / total_shots
    
    # Sort by probability for chart (top states)
    sorted_probs = sorted(probabilities.items(), key=lambda x: x[1], reverse=True)[:8]
    probability_chart = [
        {"state": state, "count": counts[state], "probability": prob}
        for state, prob in sorted_probs
    ]
    
    end_time = time.perf_counter()
    execution_time = (end_time - start_time) * 1000
    
    return {
        'counts': counts,
        'execution_time_ms': round(execution_time, 4),
        'circuit_depth': qc.depth(),
        'gate_count': len(qc.data),
        'num_qubits': n_qubits,
        'time_complexity': f"O({n_qubits}^2) gates",
        'n_points_original': n_original,
        'n_points_padded': n_padded,
        'input_amplitudes': [float(np.abs(a)) for a in normalized_amplitudes[:n_padded]],
        'probabilities': probability_chart,
        'note': 'QFT uses amplitude encoding from same signal data as FFT'
    }


def build_qft_trace(n_qubits):
    """
    Build trace table for QFT circuit visualization.
    One row per stage/column in the circuit.
    """
    stages = []
    step_num = 0
    
    def append_stage(operation, wire_markers, phase_label):
        nonlocal step_num
        step_num += 1
        stages.append({
            'step': step_num,
            'operation': operation,
            'wire_markers': {i: wire_markers.get(i, '-') for i in range(n_qubits)},
            'phase': phase_label
        })
    
    # Initialize: all qubits at |0>
    init_markers = {i: '|0⟩' for i in range(n_qubits)}
    append_stage('Initialize', init_markers, 'init')
    
    # QFT stages: H and controlled rotations
    for j in range(n_qubits):
        # Hadamard on qubit j
        h_markers = {i: '-' for i in range(n_qubits)}
        h_markers[j] = 'H'
        append_stage(f'H on q{j}', h_markers, 'transform')
        
        # Controlled phase rotations from higher qubits
        for k in range(j + 1, n_qubits):
            cp_markers = {i: '-' for i in range(n_qubits)}
            cp_markers[k] = '●'  # Control
            cp_markers[j] = 'P'  # Target with phase
            angle_deg = 180 / (2 ** (k - j))
            append_stage(f'CP({angle_deg:.1f}°) q{k}→q{j}', cp_markers, 'transform')
    
    # SWAP stage
    for i in range(n_qubits // 2):
        swap_markers = {i: '⇄', n_qubits - 1 - i: '⇄'}
        for other in range(n_qubits):
            if other not in swap_markers:
                swap_markers[other] = '-'
        append_stage(f'SWAP q{i}↔q{n_qubits - 1 - i}', swap_markers, 'swap')
    
    # Measurement stage
    for i in range(n_qubits):
        m_markers = {j: ('M' if j == i else '-') for j in range(n_qubits)}
        append_stage(f'Measure q{i}', m_markers, 'measure')
    
    return stages


@api_bp.route('/qft/cases', methods=['GET'])
def qft_cases():
    """
    GET /api/qft/cases
    Returns list of all available QFT cases.
    """
    cases = get_all_cases()
    return jsonify({
        'cases': cases,
        'count': len(cases)
    })


@api_bp.route('/qft/dataset/<case_id>', methods=['GET'])
def qft_dataset(case_id):
    """
    GET /api/qft/dataset/<case_id>
    Returns raw dataset for a specific case.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    return jsonify(case)


@api_bp.route('/qft/benchmark', methods=['POST'])
def qft_benchmark():
    """
    POST /api/qft/benchmark
    Body: { "case_id": str, "shots": int }
    Returns FFT vs QFT comparison with chart data.
    """
    data = request.get_json() or {}
    
    case_id = data.get('case_id', 'QFT-01')
    shots = data.get('shots', 1024)
    
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    
    # Get signal data from dataset
    signal_data = case.get('signal_data', [])
    n_points_original = len(signal_data)
    
    # Pad to power of 2
    n_padded = next_power_of_2(n_points_original)
    padded_signal = pad_signal(signal_data, n_padded)
    n_qubits = int(math.log2(n_padded))
    
    # Run classical FFT - FULL version with chart data
    fft_result = run_fft_full(padded_signal)
    
    # Run quantum QFT using SAME signal data
    qft_result = run_qft_from_signal(signal_data, shots)
    
    return jsonify({
        'timestamp': datetime.now().isoformat(),
        'case_id': case_id,
        'signal_type': case.get('signal_type', 'unknown'),
        'n_points_original': n_points_original,
        'n_points_padded': n_padded,
        'n_qubits': n_qubits,
        'shots': shots,
        'input_signal': signal_data,
        'padded_signal': padded_signal,
        'fft': fft_result,
        'qft': qft_result,
        'comparison': {
            'fft_complexity': f"O({n_padded} log {n_padded})",
            'qft_complexity': f"O({n_qubits}^2) gates = O({n_qubits ** 2})",
            'speedup_factor': 'Note: QFT runtime on classical simulator includes amplitude encoding, QFT circuit execution, and measurement. This is NOT comparable to FFT runtime as physical quantum advantage.',
            'note': 'Both FFT and QFT use the SAME dataset signal. Classical FFT computes frequency spectrum directly. Quantum QFT uses amplitude encoding from the signal, applies QFT transformation on quantum state, then measures.'
        }
    })


@api_bp.route('/qft/circuit-image/<case_id>', methods=['GET'])
def qft_circuit_image(case_id):
    """
    GET /api/qft/circuit-image/<case_id>
    Returns QFT circuit as PNG base64 image.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    
    signal_data = case.get('signal_data', [])
    n_points_original = len(signal_data)
    n_padded = next_power_of_2(n_points_original)
    n_qubits = int(math.log2(n_padded))
    
    qc = create_qft_circuit(n_qubits)
    
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
            'n_points_original': n_points_original,
            'n_points_padded': n_padded,
            'image': img_base64,
            'depth': qc.depth(),
            'gate_count': len(qc.data)
        })
    except Exception as e:
        return jsonify({'error': f'Failed to generate circuit: {str(e)}'}), 500


@api_bp.route('/qft/trace/<case_id>', methods=['GET'])
def qft_trace(case_id):
    """
    GET /api/qft/trace/<case_id>
    Returns trace table for QFT circuit.
    """
    case = load_case(case_id)
    if not case:
        return jsonify({'error': f'Case {case_id} not found'}), 404
    
    signal_data = case.get('signal_data', [])
    n_points_original = len(signal_data)
    n_padded = next_power_of_2(n_points_original)
    n_qubits = int(math.log2(n_padded))
    
    stages = build_qft_trace(n_qubits)
    
    # Compute partitions for phase grouping
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
                    'end': i
                })
            current_phase = stage['phase']
            start_idx = i
    
    # Add final partition
    if current_phase is not None:
        partitions.append({
            'stageId': current_phase,
            'label': current_phase.capitalize(),
            'start': start_idx,
            'end': len(stages)
        })
    
    return jsonify({
        'case_id': case_id,
        'n_qubits': n_qubits,
        'n_points_original': n_points_original,
        'n_points_padded': n_padded,
        'stages': stages,
        'partitions': partitions
    })
