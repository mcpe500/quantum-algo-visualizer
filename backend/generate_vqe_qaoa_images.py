import argparse
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch
import numpy as np

from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.visualization import circuit_drawer

from services.qaoa_service import create_qaoa_circuit, get_qaoa_cases, _get_problem_from_case
from services.vqe_service import build_ansatz_circuit, get_vqe_cases


generated = []
errors = []


def save_fig(fig, output_dir, filename):
    path = os.path.join(output_dir, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fig.savefig(path, format='png', bbox_inches='tight', dpi=150, facecolor='white')
    plt.close(fig)
    generated.append(path)


def generate_vqe_circuits(output_dir):
    for case in get_vqe_cases():
        case_id = case.get('case_id', 'unknown')
        try:
            experiment = case.get('experiment', {})
            preprocessing = case.get('preprocessing', {})
            n_qubits = int(preprocessing.get('target_qubits') or experiment.get('n_qubits'))
            ansatz_type = experiment.get('ansatz_type', 'ry_linear')
            n_layers = int(experiment.get('n_layers', 1))
            qc, params = build_ansatz_circuit(n_qubits, ansatz_type, n_layers)
            bound = qc.assign_parameters({params[i]: float(np.pi / 4) for i in range(len(params))})
            fig = circuit_drawer(bound, output='mpl')
            save_fig(fig, output_dir, f'vqe_circuit_{case_id}.png')
        except Exception as exc:
            errors.append(f'vqe_circuit_{case_id}: {exc}')


def generate_vqe_measurement_circuits(output_dir):
    n_qubits = 2
    basis_builders = {
        'Z': lambda qc, qr: None,
        'X': lambda qc, qr: [qc.h(q) for q in qr],
        'Y': lambda qc, qr: [(qc.sdg(q), qc.h(q)) for q in qr],
    }
    for basis, apply_basis in basis_builders.items():
        try:
            qr = QuantumRegister(n_qubits, 'q')
            cr = ClassicalRegister(n_qubits, 'c')
            qc = QuantumCircuit(qr, cr)
            apply_basis(qc, qr)
            qc.measure(qr, cr)
            fig = circuit_drawer(qc, output='mpl')
            save_fig(fig, output_dir, f'vqe_measurement_{basis}.png')
        except Exception as exc:
            errors.append(f'vqe_measurement_{basis}: {exc}')


def generate_qaoa_circuits(output_dir):
    for case in get_qaoa_cases():
        case_id = case.get('case_id', 'unknown')
        try:
            problem = _get_problem_from_case(case)
            gamma = [0.5] * int(problem['p_layers'])
            beta = [0.3] * int(problem['p_layers'])
            qc = create_qaoa_circuit(problem, gamma, beta)
            fig = circuit_drawer(qc, output='mpl')
            save_fig(fig, output_dir, f'qaoa_full_circuit_{case_id}.png')
        except Exception as exc:
            errors.append(f'qaoa_full_circuit_{case_id}: {exc}')


def generate_hybrid_cycle(output_dir, filename, title, boxes):
    try:
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.set_xlim(0, 10)
        ax.set_ylim(0, 6)
        ax.axis('off')
        for x, y, text, color in boxes:
            box = FancyBboxPatch((x, y), 2, 1, boxstyle='round,pad=0.1', edgecolor=color, facecolor=color, alpha=0.15, linewidth=2)
            ax.add_patch(box)
            ax.text(x + 1, y + 0.5, text, ha='center', va='center', fontsize=10, fontweight='bold', color=color)
        for start, end in [((3, 5), (4, 5)), ((6, 5), (7, 5)), ((8, 4.5), (8, 3.5)), ((7, 3), (6, 3)), ((4, 3), (3, 3)), ((1, 3), (1, 4.5))]:
            ax.annotate('', xy=end, xytext=start, arrowprops=dict(arrowstyle='->', color='#374151', lw=2))
        ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
        save_fig(fig, output_dir, filename)
    except Exception as exc:
        errors.append(f'{filename}: {exc}')


def main():
    parser = argparse.ArgumentParser(description='Generate VQE/QAOA images from dataset JSON cases.')
    parser.add_argument('--output-dir', default=os.path.join('generated', 'vqe_qaoa'))
    args = parser.parse_args()

    generate_vqe_circuits(args.output_dir)
    generate_vqe_measurement_circuits(args.output_dir)
    generate_qaoa_circuits(args.output_dir)
    generate_hybrid_cycle(args.output_dir, 'vqe_hybrid_cycle.png', 'Siklus Hibrid VQE', [
        (1, 4.5, 'Inisialisasi\nParameter theta', '#3B82F6'),
        (4, 4.5, 'Bangun\nAnsatz U(theta)', '#10B981'),
        (7, 4.5, 'Statevector\n|psi(theta)>', '#F59E0B'),
        (7, 2.5, 'Ukur Ekspektasi\n<psi|H|psi>', '#8B5CF6'),
        (4, 2.5, 'Optimizer\nKlasik', '#EF4444'),
        (1, 2.5, 'Evaluasi\nKonvergensi', '#6B7280'),
    ])
    generate_hybrid_cycle(args.output_dir, 'qaoa_hybrid_cycle.png', 'Siklus Hibrid QAOA', [
        (1, 4.5, 'Inisialisasi\ngamma, beta', '#3B82F6'),
        (4, 4.5, 'Bangun\nSirkuit QAOA', '#10B981'),
        (7, 4.5, 'Superposisi\nCost + Mixer', '#F59E0B'),
        (7, 2.5, 'Ukur Ekspektasi\nCut', '#8B5CF6'),
        (4, 2.5, 'Optimizer\nKlasik', '#EF4444'),
        (1, 2.5, 'Evaluasi\nKonvergensi', '#6B7280'),
    ])

    print('GENERATED:', generated)
    print('ERRORS:', errors)


if __name__ == '__main__':
    main()
