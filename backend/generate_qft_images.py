import argparse
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from qiskit.visualization import circuit_drawer

from services.qft_service import create_qft_circuit, get_qft_cases, run_fft_full


generated = []
errors = []


def save_fig(fig, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fig.savefig(path, dpi=150, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    generated.append(path)


def generate_circuit_images(output_dir):
    for case in get_qft_cases():
        case_id = case.get('case_id')
        try:
            signal = [float(v) for v in case.get('signal_data', [])]
            n_points = len(signal) or int(case.get('n_points', 1) or 1)
            n_padded = 1 << (n_points - 1).bit_length() if n_points > 1 else 1
            n_qubits = int(np.log2(n_padded))
            qc = create_qft_circuit(n_qubits)
            fig = circuit_drawer(qc, output='mpl')
            save_fig(fig, os.path.join(output_dir, f'qft_circuit_{case_id}.png'))
        except Exception as exc:
            errors.append(f'{case_id}: {exc}')


def generate_complexity_chart(output_dir):
    cases = get_qft_cases()
    if not cases:
        errors.append('complexity chart: no QFT dataset cases found')
        return

    try:
        rows = []
        for case in cases:
            signal = [float(v) for v in case.get('signal_data', [])]
            n_points = len(signal) or int(case.get('n_points', 1) or 1)
            n_padded = 1 << (n_points - 1).bit_length() if n_points > 1 else 1
            n_qubits = int(np.log2(n_padded))
            qc = create_qft_circuit(n_qubits)
            fft_result = run_fft_full(signal + [0.0] * (n_padded - len(signal)))
            rows.append((case.get('case_id', 'unknown'), len(qc.data), fft_result['operations']))

        labels = [row[0] for row in rows]
        x = np.arange(len(labels))
        width = 0.35
        fig, ax = plt.subplots(figsize=(max(8, len(labels) * 1.4), 5))
        ax.bar(x - width / 2, [row[1] for row in rows], width, label='QFT gates', color='#3B82F6')
        ax.bar(x + width / 2, [row[2] for row in rows], width, label='FFT operations', color='#10B981')
        ax.set_xlabel('Dataset case')
        ax.set_ylabel('Operations / gates')
        ax.set_title('QFT vs FFT Complexity by Dataset')
        ax.set_xticks(x)
        ax.set_xticklabels(labels)
        ax.legend()
        ax.set_yscale('log')
        ax.grid(axis='y', linestyle='--', alpha=0.4)
        fig.tight_layout()
        save_fig(fig, os.path.join(output_dir, 'qft_complexity.png'))
    except Exception as exc:
        errors.append(f'complexity chart: {exc}')


def main():
    parser = argparse.ArgumentParser(description='Generate QFT images from dataset JSON cases.')
    parser.add_argument('--output-dir', default=os.path.join('generated', 'qft'))
    args = parser.parse_args()

    generate_circuit_images(args.output_dir)
    generate_complexity_chart(args.output_dir)

    print('GENERATED:', generated)
    print('ERRORS:', errors)


if __name__ == '__main__':
    main()
