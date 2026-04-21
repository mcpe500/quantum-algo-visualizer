import argparse
import math
import sys
import types
from pathlib import Path

import numpy as np
from qiskit import QuantumCircuit
from qiskit.quantum_info import DensityMatrix, Statevector, partial_trace


def _install_api_stub():
    api_module = types.ModuleType('api')
    shared_module = types.ModuleType('api.shared')
    plotting_module = types.ModuleType('api.shared.plotting')
    plotting_module.figure_to_base64 = lambda fig: 'stub'
    shared_module.plotting = plotting_module
    api_module.shared = shared_module
    sys.modules.setdefault('api', api_module)
    sys.modules.setdefault('api.shared', shared_module)
    sys.modules.setdefault('api.shared.plotting', plotting_module)


def _bootstrap_backend():
    backend_root = Path(__file__).resolve().parent
    if str(backend_root) not in sys.path:
        sys.path.insert(0, str(backend_root))
    _install_api_stub()


_bootstrap_backend()

from services.qft_service import (  # noqa: E402
    _normalize_amplitudes,
    get_qft_animation_payload,
    get_qft_case_or_none,
    get_qft_cases,
    next_power_of_2,
    pad_signal,
)


TOLERANCE = 1e-6


def _statevector_from_payload(step):
    return np.array([complex(item['re'], item['im']) for item in step['statevector']], dtype=complex)


def _align_global_phase(candidate, reference):
    candidate = np.array(candidate, dtype=complex)
    reference = np.array(reference, dtype=complex)
    if candidate.shape != reference.shape:
        raise ValueError('statevector shape mismatch')

    pivot = None
    for index, value in enumerate(reference):
        if abs(value) > 1e-9 and abs(candidate[index]) > 1e-9:
            pivot = index
            break

    if pivot is None:
        return candidate

    phase = np.angle(candidate[pivot]) - np.angle(reference[pivot])
    return candidate * np.exp(-1j * phase)


def _reduced_summary(statevector, n_qubits, qubit):
    density = DensityMatrix(Statevector(statevector))
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
    return {
        'p_zero': p_zero,
        'p_one': p_one,
        'bx': x,
        'by': y,
        'bz': z,
        'radius': radius,
        'phase': phase,
    }


def _expected_timeline(signal, n_qubits):
    padded_signal = pad_signal(signal, 2 ** n_qubits)
    normalized = _normalize_amplitudes(padded_signal)
    sv = Statevector(normalized)
    timeline = [('init', sv.data.copy())]

    for j in range(n_qubits - 1, -1, -1):
        for k in range(n_qubits - 1, j, -1):
            angle = math.pi / (2 ** (k - j))
            circuit = QuantumCircuit(n_qubits)
            circuit.cp(angle, k, j)
            sv = sv.evolve(circuit)
            timeline.append(('phase_cascade', sv.data.copy()))

        circuit = QuantumCircuit(n_qubits)
        circuit.h(j)
        sv = sv.evolve(circuit)
        timeline.append(('hadamard', sv.data.copy()))

    for i in range(n_qubits // 2):
        circuit = QuantumCircuit(n_qubits)
        circuit.swap(i, n_qubits - 1 - i)
        sv = sv.evolve(circuit)
        timeline.append(('swap', sv.data.copy()))

    timeline.append(('measurement', sv.data.copy()))
    return timeline


def _expected_step_count(n_qubits):
    return 1 + ((n_qubits * (n_qubits - 1)) // 2) + n_qubits + (n_qubits // 2) + 1


def _validate_case(case_id):
    case = get_qft_case_or_none(case_id)
    if not case:
        raise AssertionError(f'case not found: {case_id}')

    payload = get_qft_animation_payload(case_id, shots=1024)
    if payload is None:
        raise AssertionError(f'animation payload not found: {case_id}')

    signal = [float(value) for value in case.get('signal_data', [])]
    n_original = len(signal) if signal else int(case.get('n_points', 1))
    n_padded = next_power_of_2(n_original)
    n_qubits = int(math.log2(n_padded))

    expected_steps = _expected_step_count(n_qubits)
    timeline = payload['timeline']
    if len(timeline) != expected_steps:
        raise AssertionError(f'{case_id}: expected {expected_steps} timeline steps, got {len(timeline)}')

    reference_timeline = _expected_timeline(signal, n_qubits)
    if len(reference_timeline) != len(timeline):
        raise AssertionError(f'{case_id}: reference timeline length mismatch')

    for index, (step, reference) in enumerate(zip(timeline, reference_timeline)):
        expected_phase, expected_state = reference
        if step['phase'] != expected_phase:
            raise AssertionError(f'{case_id}: step {index} phase mismatch: expected {expected_phase}, got {step["phase"]}')

        candidate_state = _statevector_from_payload(step)
        aligned_candidate = _align_global_phase(candidate_state, expected_state)
        state_diff = float(np.linalg.norm(aligned_candidate - expected_state))
        if state_diff > TOLERANCE:
            raise AssertionError(f'{case_id}: step {index} state mismatch diff={state_diff:.6e}')

        expected_probs = np.abs(expected_state) ** 2
        payload_probs = np.array(step['probabilities'], dtype=float)
        prob_diff = float(np.linalg.norm(payload_probs - expected_probs))
        if prob_diff > TOLERANCE:
            raise AssertionError(f'{case_id}: step {index} probability mismatch diff={prob_diff:.6e}')

        summaries = step.get('qubit_summaries') or []
        if len(summaries) != n_qubits:
            raise AssertionError(f'{case_id}: step {index} qubit summary count mismatch')

        for qubit_index, summary in enumerate(summaries):
            expected_summary = _reduced_summary(expected_state, n_qubits, qubit_index)
            for key in ('p_zero', 'p_one', 'bx', 'by', 'bz', 'radius', 'phase'):
                actual = float(summary[key])
                expected_value = float(expected_summary[key])
                if abs(actual - expected_value) > 5e-6:
                    raise AssertionError(
                        f'{case_id}: step {index} qubit {qubit_index} summary mismatch for {key}: '
                        f'expected {expected_value:.6f}, got {actual:.6f}'
                    )

    final_counts = payload['measurement']['counts']
    total_counts = sum(int(count) for count in final_counts.values())
    if total_counts != 1024:
        raise AssertionError(f'{case_id}: measurement counts total {total_counts}, expected 1024')

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'steps': len(timeline),
    }


def _default_cases():
    return [case['case_id'] for case in get_qft_cases()]


def main():
    parser = argparse.ArgumentParser(description='Validate QFT animation timeline against Qiskit reference evolution.')
    parser.add_argument('--cases', nargs='*', default=None, help='Case IDs to validate. Defaults to all QFT cases.')
    args = parser.parse_args()

    case_ids = args.cases or _default_cases()
    failures = []

    for case_id in case_ids:
        try:
            result = _validate_case(case_id)
            print(f'PASS {result["case_id"]}: n_qubits={result["n_qubits"]}, steps={result["steps"]}')
        except Exception as exc:  # noqa: BLE001
            failures.append((case_id, str(exc)))
            print(f'FAIL {case_id}: {exc}')

    if failures:
        print('\nValidation failed.')
        raise SystemExit(1)

    print('\nValidation passed for all requested cases.')


if __name__ == '__main__':
    main()
