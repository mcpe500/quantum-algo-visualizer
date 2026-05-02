import matplotlib
matplotlib.use('Agg')

import math
import time
import numpy as np
from scipy.optimize import minimize
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp, Statevector
from qiskit.visualization import circuit_drawer
from qiskit_aer import AerSimulator
from qiskit.primitives import BackendEstimatorV2

from services.common import list_cases, load_case, load_case_canonical


def get_vqe_case_or_none(case_id):
    return load_case_canonical('vqe', case_id)


def get_vqe_dataset_payload(case_id):
    raw = load_case('vqe', case_id)
    canonical = load_case_canonical('vqe', case_id)
    if raw is None or canonical is None:
        return None

    preprocessing = raw.get('preprocessing', {})
    target_qubits = int(preprocessing.get('target_qubits', canonical.get('qubits', 0)))
    initial_qubits = int(preprocessing.get('initial_qubits', target_qubits))
    qubit_reduction = str(preprocessing.get('qubit_reduction', 'none'))
    mapping = str(preprocessing.get('mapping', ''))

    if qubit_reduction == 'z2_tapering':
        transform_source = 'z2_tapered_jordan_wigner'
        transform_note = (
            'Canonical 2-qubit Hamiltonian uses the H2/STO-3G Z2-tapered '
            'Jordan-Wigner singlet sector; raw JSON remains the compact experiment specification.'
        )
    else:
        transform_source = 'jordan_wigner_mapping'
        transform_note = (
            'Canonical Hamiltonian is produced from the H2/STO-3G preprocessing pipeline '
            'and Jordan-Wigner mapping into the target qubit register.'
        )

    payload = dict(canonical)
    payload['raw_spec'] = {
        'problem_type': raw.get('problem_type'),
        'molecule_spec': raw.get('molecule_spec', {}),
        'preprocessing': raw.get('preprocessing', {}),
        'experiment': raw.get('experiment', {}),
    }
    payload['transform'] = {
        'source': transform_source,
        'mapping': mapping,
        'initial_qubits': initial_qubits,
        'qubit_reduction': qubit_reduction,
        'target_qubits': target_qubits,
        'hamiltonian_format': preprocessing.get('hamiltonian_format'),
        'canonical_terms': len(canonical.get('hamiltonian', {}).get('terms', {})),
        'note': transform_note,
    }
    return payload


def get_vqe_cases():
    return list_cases('vqe', 'VQE-')


def _qubit_index(qubit):
    if hasattr(qubit, 'index'):
        return int(qubit.index)
    if hasattr(qubit, '_index'):
        return int(qubit._index)
    return 0


def build_hamiltonian_op(hamiltonian_terms):
    pauli_list = [(str(pauli), float(coeff)) for pauli, coeff in hamiltonian_terms.items()]
    if not pauli_list:
        pauli_list = [('I', 0.0)]
    return SparsePauliOp.from_list(pauli_list)


def build_ansatz_no_measure(n_qubits, ansatz_type, n_layers):
    n_params = n_qubits * n_layers
    params = ParameterVector('theta', n_params)
    qc = QuantumCircuit(n_qubits)

    for layer in range(n_layers):
        for i in range(n_qubits):
            qc.ry(params[layer * n_qubits + i], i)

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                qc.cx(i, i + 1)
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                qc.cx(i, (i + 1) % n_qubits)

    return qc, params


def build_ansatz_circuit(n_qubits, ansatz_type, n_layers):
    n_params = n_qubits * n_layers
    params = ParameterVector('theta', n_params)
    qr = QuantumRegister(n_qubits, 'q')
    cr = ClassicalRegister(n_qubits, 'c')
    qc = QuantumCircuit(qr, cr)

    for layer in range(n_layers):
        for i in range(n_qubits):
            qc.ry(params[layer * n_qubits + i], qr[i])

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                qc.cx(qr[i], qr[i + 1])
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                qc.cx(qr[i], qr[(i + 1) % n_qubits])

    qc.measure(qr, cr)
    return qc, params


def run_vqe_internal(hamiltonian_op, n_qubits, ansatz_type, n_layers, max_iter=150):
    n_params = n_qubits * n_layers
    qc, params = build_ansatz_no_measure(n_qubits, ansatz_type, n_layers)

    history = []

    def energy_fn(values):
        param_dict = {params[i]: float(values[i]) for i in range(n_params)}
        qc_bound = qc.assign_parameters(param_dict)
        state = Statevector(qc_bound)
        energy = float(state.expectation_value(hamiltonian_op).real)
        history.append({'params': values.copy().tolist(), 'energy': energy})
        return energy

    np.random.seed(42)
    x0 = np.random.uniform(0, np.pi, n_params)
    result = minimize(
        energy_fn,
        x0,
        method='COBYLA',
        options={'maxiter': int(max_iter), 'rhobeg': 0.5},
    )

    final_dict = {params[i]: float(result.x[i]) for i in range(n_params)}
    qc_final = qc.assign_parameters(final_dict)

    return {
        'energy': float(result.fun),
        'history': history,
        'convergence_history': [float(v['energy']) for v in history[:200]],
        'optimal_parameters': [float(v) for v in result.x],
        'iterations': int(result.nfev),
        'circuit_depth': int(qc_final.depth()),
        'gate_count': int(len(qc_final.data)),
    }


def _select_checkpoints(history, n=5):
    if not history:
        return []
    m = len(history)
    if m <= n:
        return list(range(m))
    return [min(m - 1, int(i * (m - 1) / (n - 1))) for i in range(n)]


def _generate_snapshot_circuit_image(n_qubits, ansatz_type, n_layers, theta_values):
    qc, params = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)
    if len(theta_values) != len(params):
        return None
    bound = qc.assign_parameters({params[i]: float(theta_values[i]) for i in range(len(params))})
    fig = circuit_drawer(bound, output='mpl')
    try:
        from api.shared.plotting import figure_to_base64
        return figure_to_base64(fig)
    finally:
        import matplotlib.pyplot as plt
        plt.close(fig)


def _format_number(value, digits=6):
    try:
        real_value = float(np.real_if_close(value).real)
    except Exception:
        return str(value)
    return f'{real_value:.{digits}f}'


def _trace_value(label, value, tone='slate'):
    return {'label': str(label), 'value': str(value), 'tone': str(tone)}


def _matrix_preview(matrix, limit=4):
    dim = int(matrix.shape[0])
    size = min(dim, int(limit))
    rows = []
    for row_idx in range(size):
        row = []
        for col_idx in range(size):
            value = np.real_if_close(matrix[row_idx, col_idx])
            complex_value = complex(value)
            if abs(complex_value.imag) > 1e-8:
                row.append(f'{complex_value.real:.3f}{complex_value.imag:+.3f}i')
            else:
                row.append(f'{complex_value.real:.3f}')
        rows.append(row)
    return {
        'dimension': f'{dim}x{dim}',
        'rows': rows,
        'truncated': dim > size,
    }


def _pauli_terms_payload(hamiltonian_terms):
    return [
        {
            'pauli': str(pauli),
            'coefficient': float(coeff),
            'text': f'{float(coeff):+.6f} {pauli}',
        }
        for pauli, coeff in hamiltonian_terms.items()
    ]


def _iteration_trace_payload(history, n=6):
    trace = []
    for idx in _select_checkpoints(history, n):
        entry = history[idx]
        trace.append({
            'iteration': int(idx),
            'energy': float(entry['energy']),
            'parameters': [float(v) for v in entry.get('params', [])],
        })
    return trace


def _step(step, phase, title, summary, formula=None, calculation=None, result=None, values=None, **extra):
    payload = {
        'step': int(step),
        'phase': str(phase),
        'title': str(title),
        'summary': str(summary),
        'formula': formula,
        'calculation': calculation or [],
        'result': result,
        'values': values or [],
    }
    payload.update(extra)
    return payload


def _build_vqe_fci_computational_trace(
    case_id,
    raw_case,
    canonical_case,
    hamiltonian_terms,
    hamiltonian_matrix,
    eigenvalues,
    fci_energy,
    fci_time_ms,
    vqe_result,
    vqe_time_ms,
    energy_error,
    accuracy,
    shots,
    shot_eval,
):
    molecule_spec = raw_case.get('molecule_spec', {}) if raw_case else {}
    preprocessing = raw_case.get('preprocessing', {}) if raw_case else {}
    experiment = raw_case.get('experiment', {}) if raw_case else {}

    formula = str(molecule_spec.get('formula', canonical_case.get('molecule', 'H2')))
    distance = float(molecule_spec.get('interatomic_distance_angstrom', 0.735))
    basis = str(molecule_spec.get('basis', 'sto-3g')).upper()
    charge = int(molecule_spec.get('charge', 0))
    multiplicity = int(molecule_spec.get('multiplicity', 1))
    proton_count = 2 if formula == 'H2' else 0
    electron_count = max(0, proton_count - charge)
    spatial_orbitals = 2
    spin_orbitals = spatial_orbitals * 2
    determinant_count = math.comb(spin_orbitals, electron_count) if 0 <= electron_count <= spin_orbitals else 0
    target_qubits = int(preprocessing.get('target_qubits', canonical_case.get('qubits', 0)))
    initial_qubits = int(preprocessing.get('initial_qubits', max(target_qubits, 4)))
    qubit_reduction = str(preprocessing.get('qubit_reduction', 'none'))
    mapping = str(preprocessing.get('mapping', 'jordan_wigner'))
    ansatz_type = str(experiment.get('ansatz_type', canonical_case.get('ansatz', {}).get('type', 'ry_linear')))
    n_layers = int(experiment.get('n_layers', canonical_case.get('ansatz', {}).get('n_layers', 1)))
    n_params = target_qubits * n_layers
    matrix_dim = int(hamiltonian_matrix.shape[0])
    term_count = len(hamiltonian_terms)
    first_history = vqe_result.get('history', [{}])[0] if vqe_result.get('history') else {}
    last_history = vqe_result.get('history', [{}])[-1] if vqe_result.get('history') else {}
    eigen_preview = [_format_number(v) for v in eigenvalues[:min(6, len(eigenvalues))]]
    pauli_terms = _pauli_terms_payload(hamiltonian_terms)
    matrix_preview = _matrix_preview(hamiltonian_matrix)

    fci_steps = [
        _step(
            1,
            'input',
            'Membaca Molekul dan Basis Set',
            'Trace dimulai dari spesifikasi molekul H₂, jarak antaratom, basis STO-3G, muatan, dan multiplicity.',
            formula='N_e = Z_total - charge',
            calculation=[
                f'Z_total = {proton_count}',
                f'N_e = {proton_count} - ({charge}) = {electron_count}',
            ],
            result=f'{electron_count} elektron pada molekul {formula}.',
            values=[
                _trace_value('Molecule', formula, 'blue'),
                _trace_value('R', f'{distance:.3f} Å', 'blue'),
                _trace_value('Basis', basis, 'blue'),
                _trace_value('Multiplicity', multiplicity, 'blue'),
            ],
        ),
        _step(
            2,
            'orbital',
            'Membangun Orbital Molekul',
            'Basis minimal STO-3G memberi dua orbital spasial untuk H₂; setiap orbital memiliki spin α dan β.',
            formula='N_spin_orbitals = 2 × N_spatial_orbitals',
            calculation=[
                f'N_spatial_orbitals = {spatial_orbitals}',
                f'N_spin_orbitals = 2 × {spatial_orbitals} = {spin_orbitals}',
            ],
            result='Orbital bonding σg dan antibonding σu* menjadi ruang konfigurasi elektronik.',
            values=[
                _trace_value('Spatial orbitals', spatial_orbitals, 'emerald'),
                _trace_value('Spin orbitals', spin_orbitals, 'emerald'),
            ],
        ),
        _step(
            3,
            'configuration',
            'Menyusun Determinan Slater',
            'FCI mengevaluasi semua konfigurasi elektron yang valid sebelum mengambil sektor energi terendah.',
            formula='Dimensi konfigurasi = C(N_spin_orbitals, N_e)',
            calculation=[
                f'C({spin_orbitals}, {electron_count}) = {determinant_count}',
                'Contoh basis: |1100>, |1010>, |1001>, |0110>, |0101>, |0011>',
            ],
            result=f'{determinant_count} determinan menjadi ruang konfigurasi sebelum diagonalization.',
            values=[
                _trace_value('Determinants', determinant_count, 'amber'),
                _trace_value('Electron sector', electron_count, 'amber'),
            ],
        ),
        _step(
            4,
            'hamiltonian',
            'Membangun Hamiltonian Qubit',
            'Hamiltonian molekul direpresentasikan sebagai penjumlahan operator Pauli yang dapat didiagonalisasi dan diukur.',
            formula='H = Σᵢ cᵢ Pᵢ',
            calculation=[
                f'{term_count} Pauli terms digunakan pada {target_qubits} qubit.',
                f'Matrix runtime dari Pauli Hamiltonian berukuran {matrix_dim}×{matrix_dim}.',
            ],
            result='Matriks Hamiltonian siap untuk exact diagonalization FCI.',
            values=[
                _trace_value('Pauli terms', term_count, 'purple'),
                _trace_value('Matrix size', f'{matrix_dim}×{matrix_dim}', 'purple'),
            ],
            pauli_terms=pauli_terms,
            matrix_preview=matrix_preview,
        ),
        _step(
            5,
            'diagonalization',
            'Diagonalisasi Matriks Hamiltonian',
            'FCI menyelesaikan eigenvalue problem dan memilih eigenvalue paling rendah sebagai energi ground state.',
            formula='H c = E c,  E₀ = min eig(H)',
            calculation=[
                f'Eigenvalue preview = [{", ".join(eigen_preview)}]',
                f'E₀ = {fci_energy:.9f} Hartree',
            ],
            result=f'Energi ground state FCI = {fci_energy:.6f} Hartree.',
            values=[
                _trace_value('E_FCI', f'{fci_energy:.6f} Ha', 'emerald'),
                _trace_value('Runtime', f'{fci_time_ms:.4f} ms', 'emerald'),
            ],
        ),
        _step(
            6,
            'reference',
            'Menetapkan Referensi Klasik',
            'Energi FCI menjadi baseline akurasi untuk VQE karena diperoleh dari diagonalization eksak Hamiltonian yang sama.',
            formula='Error_VQE = |E_VQE - E_FCI|',
            calculation=[
                f'E_FCI = {fci_energy:.9f} Hartree',
                f'Complexity diagonalization = O({matrix_dim}³)',
            ],
            result='Baseline klasik tersedia untuk membandingkan hasil kuantum variational.',
            values=[
                _trace_value('Complexity', f'O({matrix_dim}³)', 'slate'),
                _trace_value('Reference', 'FCI exact', 'slate'),
            ],
        ),
    ]

    shot_lines = []
    shot_values = [_trace_value('Requested shots', int(shots), 'slate')]
    shot_result = 'Shot-based evaluation tidak tersedia; energi VQE tetap berasal dari Statevector exact.'
    if shot_eval:
        shot_lines = [
            f'E_shot = {shot_eval["energy"]:.9f} Hartree',
            f'std = {shot_eval["std"]:.9f}',
            f'|E_shot - E_FCI| = {shot_eval["energy_error"]:.9f} Hartree',
        ]
        shot_values = [
            _trace_value('Actual shots', shot_eval['shots'], 'purple'),
            _trace_value('E_shot', f'{shot_eval["energy"]:.6f} Ha', 'purple'),
            _trace_value('std', f'{shot_eval["std"]:.6f}', 'purple'),
        ]
        shot_result = 'Pengukuran akhir berbasis shots mensimulasikan estimasi energi pada hardware kuantum.'

    vqe_steps = [
        _step(
            1,
            'parse',
            'Parsing Konfigurasi VQE',
            'Parameter eksperimen dibaca dari kasus aktif: mapping, reduksi qubit, ansatz, optimizer, dan jumlah shots.',
            formula='config → {H, U(θ), optimizer, shots}',
            calculation=[
                f'Mapping = {mapping}',
                f'Qubit: {initial_qubits} → {target_qubits} ({qubit_reduction})',
                f'Ansatz = {ansatz_type}, layers = {n_layers}, optimizer = COBYLA',
            ],
            result='Konfigurasi runtime siap untuk membangun Hamiltonian dan sirkuit ansatz.',
            values=[
                _trace_value('Case', case_id, 'blue'),
                _trace_value('Qubits', target_qubits, 'blue'),
                _trace_value('Shots', int(shots), 'blue'),
            ],
        ),
        _step(
            2,
            'mapping',
            'Mapping Hamiltonian ke Pauli Sum',
            'Operator fermionik dipetakan menjadi operator qubit agar dapat dievaluasi oleh simulator kuantum.',
            formula='H_qubit = Σᵢ cᵢ Pᵢ',
            calculation=[
                f'Format Hamiltonian = {preprocessing.get("hamiltonian_format", "pauli_sum")}',
                f'Jumlah Pauli terms = {term_count}',
                f'Reduksi qubit = {qubit_reduction}',
            ],
            result='Hamiltonian yang sama dipakai oleh FCI dan VQE sehingga perbandingan bersifat konsisten.',
            values=[
                _trace_value('Terms', term_count, 'purple'),
                _trace_value('Reduction', qubit_reduction, 'purple'),
            ],
            pauli_terms=pauli_terms,
        ),
        _step(
            3,
            'ansatz',
            'Membangun Ansatz Parameterized Circuit',
            'Ansatz hardware-efficient memakai rotasi RY pada tiap qubit dan entanglement CNOT linear.',
            formula='U(θ) = U_entangle · U_rotate(θ)',
            calculation=[
                f'n_params = n_qubits × n_layers = {target_qubits} × {n_layers} = {n_params}',
                'U_rotate(θ) = ⊗ᵢ RY(θᵢ)',
                'U_entangle = CNOT chain 0→1→... ',
            ],
            result=f'Sirkuit ansatz memiliki {n_params} parameter variational.',
            values=[
                _trace_value('Ansatz', ansatz_type, 'emerald'),
                _trace_value('Layers', n_layers, 'emerald'),
                _trace_value('Parameters', n_params, 'emerald'),
            ],
        ),
        _step(
            4,
            'expectation',
            'Evaluasi Expectation Value',
            'Setiap parameter θ menghasilkan state |ψ(θ)⟩, lalu energi dihitung sebagai expectation value Hamiltonian.',
            formula='E(θ) = ⟨ψ(θ)|H|ψ(θ)⟩',
            calculation=[
                f'Iterasi awal: E ≈ {_format_number(first_history.get("energy", vqe_result["energy"]))} Hartree',
                f'Iterasi akhir tercatat: E ≈ {_format_number(last_history.get("energy", vqe_result["energy"]))} Hartree',
            ],
            result='Nilai energi menjadi fungsi objektif untuk optimizer klasik.',
            values=[
                _trace_value('Measurement', 'Statevector exact', 'slate'),
                _trace_value('Objective', 'min E(θ)', 'slate'),
            ],
        ),
        _step(
            5,
            'optimization',
            'Optimasi Parameter COBYLA',
            'Optimizer klasik memperbarui θ berdasarkan energi dari simulator sampai iterasi maksimum atau konvergensi lokal.',
            formula='θ* = arg minθ E(θ)',
            calculation=[
                f'Function evaluations = {vqe_result["iterations"]}',
                f'E_VQE = {vqe_result["energy"]:.9f} Hartree',
                f'Runtime optimasi = {vqe_time_ms:.4f} ms',
            ],
            result=f'Parameter optimal menghasilkan E_VQE = {vqe_result["energy"]:.6f} Hartree.',
            values=[
                _trace_value('Iterations', vqe_result['iterations'], 'amber'),
                _trace_value('E_VQE', f'{vqe_result["energy"]:.6f} Ha', 'amber'),
                _trace_value('Runtime', f'{vqe_time_ms:.4f} ms', 'amber'),
            ],
        ),
        _step(
            6,
            'shots',
            'Evaluasi Shot-Based',
            'Parameter optimal dievaluasi ulang dengan estimator berbasis shots untuk meniru pengukuran stokastik.',
            formula='precision = 1 / √shots',
            calculation=shot_lines or [f'shots = {int(shots)}', 'Estimator shot-based mengembalikan null pada runtime ini.'],
            result=shot_result,
            values=shot_values,
        ),
        _step(
            7,
            'comparison',
            'Membandingkan VQE terhadap FCI',
            'Hasil akhir VQE dinilai terhadap referensi FCI melalui error absolut dan akurasi relatif.',
            formula='accuracy = (1 - |E_VQE - E_FCI| / |E_FCI|) × 100%',
            calculation=[
                f'|E_VQE - E_FCI| = {energy_error:.9f} Hartree',
                f'accuracy = {accuracy:.4f}%',
            ],
            result='Trace selesai: seluruh jalur klasik dan kuantum memiliki baseline numerik yang sama.',
            values=[
                _trace_value('Error', f'{energy_error:.6f} Ha', 'red'),
                _trace_value('Accuracy', f'{accuracy:.2f}%', 'emerald'),
            ],
        ),
    ]

    return {
        'case_id': case_id,
        'title': f'{case_id} Computational Trace: FCI vs VQE',
        'summary': 'Trace mengikuti alur sumber FCI/VQE: input molekul → Hamiltonian → FCI exact diagonalization → VQE variational loop → evaluasi shots → perbandingan.',
        'numerical_policy': 'Nilai energi dan Hamiltonian diambil dari canonical runtime project agar konsisten dengan benchmark aktif.',
        'fci': {
            'title': 'Trace FCI (Full Configuration Interaction)',
            'steps': fci_steps,
        },
        'vqe': {
            'title': 'Trace VQE (Variational Quantum Eigensolver)',
            'steps': vqe_steps,
        },
        'iteration_trace': _iteration_trace_payload(vqe_result.get('history', [])),
        'comparison': {
            'fci_energy': float(fci_energy),
            'vqe_energy': float(vqe_result['energy']),
            'energy_error': float(energy_error),
            'accuracy_percent': round(float(accuracy), 4),
            'shots': int(shots),
            'matrix_size': f'{matrix_dim}x{matrix_dim}',
            'pauli_terms': term_count,
        },
    }


def build_ansatz_trace(n_qubits, ansatz_type, n_layers):
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

    for layer in range(n_layers):
        layer_label = f'layer {layer + 1}'
        for i in range(n_qubits):
            append_stage(
                f'Ry on q{i} ({layer_label})',
                {j: ('Ry' if j == i else '-') for j in range(n_qubits)},
                'rotation',
            )

        if ansatz_type == 'ry_linear':
            for i in range(n_qubits - 1):
                markers = {j: '-' for j in range(n_qubits)}
                markers[i] = '●'
                markers[i + 1] = '⊕'
                append_stage(f'CNOT q{i}->q{i + 1} ({layer_label})', markers, 'entanglement')
        elif ansatz_type == 'ry_circular':
            for i in range(n_qubits):
                target = (i + 1) % n_qubits
                markers = {j: '-' for j in range(n_qubits)}
                markers[i] = '●'
                markers[target] = '⊕'
                append_stage(f'CNOT q{i}->q{target} ({layer_label})', markers, 'entanglement')

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


def run_vqe_payload(case_id, shots):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None
    raw_case = load_case('vqe', case_id) or {}

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))
    hamiltonian_terms = case.get('hamiltonian', {}).get('terms', {})

    hamiltonian_op = build_hamiltonian_op(hamiltonian_terms)

    t0 = time.perf_counter()
    hamiltonian_matrix = hamiltonian_op.to_matrix()
    eigenvalues = np.linalg.eigvalsh(hamiltonian_matrix)
    fci_energy = float(eigenvalues[0])
    fci_time_ms = (time.perf_counter() - t0) * 1000.0
    dim = int(hamiltonian_matrix.shape[0])

    t1 = time.perf_counter()
    vqe_result = run_vqe_internal(hamiltonian_op, n_qubits, ansatz_type, n_layers)
    vqe_time_ms = (time.perf_counter() - t1) * 1000.0

    vqe_energy = float(vqe_result['energy'])
    energy_error = abs(vqe_energy - fci_energy)
    denom = max(abs(fci_energy), 1e-10)
    accuracy = max(0.0, min(100.0, (1.0 - energy_error / denom) * 100.0))
    n_params = n_qubits * n_layers

    snapshots = []
    checkpoints = _select_checkpoints(vqe_result.get('history', []))
    for idx in checkpoints:
        try:
            entry = vqe_result['history'][idx]
            img_b64 = _generate_snapshot_circuit_image(
                n_qubits, ansatz_type, n_layers, entry['params']
            )
            if img_b64:
                snapshots.append({
                    'iteration': idx,
                    'energy': entry['energy'],
                    'parameters': [float(v) for v in entry['params']],
                    'circuit_image': img_b64,
                })
        except Exception:
            continue

    shot_eval = None
    try:
        qc_eval, _params_eval = build_ansatz_no_measure(n_qubits, ansatz_type, n_layers)
        backend = AerSimulator()
        estimator = BackendEstimatorV2(backend=backend)
        precision = 1.0 / math.sqrt(int(shots))
        pub = (qc_eval, hamiltonian_op, vqe_result['optimal_parameters'], precision)
        job = estimator.run([pub])
        est_result = job.result()
        shot_energy = float(est_result[0].data.evs)
        shot_std = float(est_result[0].data.stds)
        actual_shots = int(est_result[0].metadata.get('shots', int(shots)))
        shot_error = abs(shot_energy - fci_energy)
        shot_eval = {
            'energy': shot_energy,
            'std': shot_std,
            'shots': actual_shots,
            'energy_error': float(shot_error),
        }
    except Exception:
        pass

    computational_trace = _build_vqe_fci_computational_trace(
        case_id=case_id,
        raw_case=raw_case,
        canonical_case=case,
        hamiltonian_terms=hamiltonian_terms,
        hamiltonian_matrix=hamiltonian_matrix,
        eigenvalues=eigenvalues,
        fci_energy=fci_energy,
        fci_time_ms=fci_time_ms,
        vqe_result=vqe_result,
        vqe_time_ms=vqe_time_ms,
        energy_error=energy_error,
        accuracy=accuracy,
        shots=shots,
        shot_eval=shot_eval,
    )

    return {
        'case_id': case_id,
        'molecule': case.get('molecule', 'Unknown'),
        'description': case.get('description', ''),
        'n_qubits': n_qubits,
        'shots': int(shots),
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'hamiltonian_terms': hamiltonian_terms,
        'classical': {
            'method': 'FCI (Exact Diagonalization)',
            'energy': fci_energy,
            'execution_time_ms': round(fci_time_ms, 4),
            'time_complexity': f'O({dim}^3)',
            'matrix_size': f'{dim}x{dim}',
            'note': 'Full Configuration Interaction exact diagonalization.',
        },
        'quantum': {
            'method': 'VQE (Variational Quantum Eigensolver)',
            'optimizer_name': 'COBYLA',
            'measurement_method': 'Statevector (exact)',
            'energy': vqe_energy,
            'iterations': int(vqe_result['iterations']),
            'circuit_depth': int(vqe_result['circuit_depth']),
            'gate_count': int(vqe_result['gate_count']),
            'time_complexity': f'O({n_params} * iter)',
            'convergence_history': vqe_result['convergence_history'],
            'optimal_parameters': vqe_result['optimal_parameters'],
            'execution_time_ms': round(vqe_time_ms, 4),
            'energy_error': float(energy_error),
            'accuracy': round(float(accuracy), 4),
            'shot_evaluation': shot_eval,
            'iteration_snapshots': snapshots,
        },
        'comparison': {
            'fci_energy': fci_energy,
            'vqe_energy': vqe_energy,
            'energy_error': float(energy_error),
            'accuracy_percent': round(float(accuracy), 4),
            'note': f'VQE reached {accuracy:.2f}% accuracy versus exact FCI.',
        },
        'computational_trace': computational_trace,
    }


def get_vqe_computational_trace_payload(case_id, shots=1024):
    payload = run_vqe_payload(case_id, shots)
    if not payload:
        return None
    return payload.get('computational_trace')


def get_vqe_circuit_payload(case_id, theta):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))

    qc, params = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)
    theta_value = float(theta)
    bound = qc.assign_parameters({params[i]: theta_value for i in range(len(params))})

    gates = []
    for instr, qargs, _ in bound.data:
        gates.append({
            'name': instr.name,
            'qubits': [_qubit_index(q) for q in qargs],
            'params': [float(p) if hasattr(p, '__float__') else str(p) for p in getattr(instr, 'params', [])],
        })

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'depth': int(bound.depth()),
        'gate_count': int(len(bound.data)),
        'gates': gates,
    }


def get_vqe_trace_payload(case_id, theta):
    _ = theta
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))

    stages = build_ansatz_trace(n_qubits, ansatz_type, n_layers)
    partitions = _build_partitions(stages)

    return {
        'case_id': case_id,
        'n_qubits': n_qubits,
        'ansatz_type': ansatz_type,
        'n_layers': n_layers,
        'stages': stages,
        'partitions': partitions,
    }


def get_vqe_classical_payload(case_id):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    hamiltonian_terms = case.get('hamiltonian', {}).get('terms', {})
    hamiltonian_op = build_hamiltonian_op(hamiltonian_terms)

    started = time.perf_counter()
    matrix = hamiltonian_op.to_matrix()
    eigenvalues = np.linalg.eigvalsh(matrix)
    fci_energy = float(eigenvalues[0])
    runtime_ms = (time.perf_counter() - started) * 1000.0
    dim = int(matrix.shape[0])

    return {
        'case_id': case_id,
        'molecule': case.get('molecule', 'Unknown'),
        'n_qubits': n_qubits,
        'hamiltonian_terms': hamiltonian_terms,
        'classical': {
            'method': 'FCI (Exact Diagonalization)',
            'energy': fci_energy,
            'execution_time_ms': round(runtime_ms, 4),
            'time_complexity': f'O({dim}^3)',
            'matrix_size': f'{dim}x{dim}',
            'note': 'Exact reference from Hamiltonian diagonalization.',
        },
    }


def get_vqe_circuit_image_payload(case_id):
    case = get_vqe_case_or_none(case_id)
    if not case:
        return None

    n_qubits = int(case.get('qubits', 2))
    ansatz = case.get('ansatz', {})
    ansatz_type = str(ansatz.get('type', 'ry_linear'))
    n_layers = int(ansatz.get('n_layers', 1))

    qc, params = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)
    bound = qc.assign_parameters({params[i]: float(np.pi / 4) for i in range(len(params))})

    try:
        fig = circuit_drawer(bound, output='mpl')
        from api.shared.plotting import figure_to_base64
        return {
            'case_id': case_id,
            'n_qubits': n_qubits,
            'ansatz_type': ansatz_type,
            'n_layers': n_layers,
            'image': figure_to_base64(fig),
            'depth': int(bound.depth()),
            'gate_count': int(len(bound.data)),
        }
    except Exception as exc:
        return {'error': f'Failed to generate circuit image: {exc}'}
