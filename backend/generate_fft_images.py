import argparse
import os

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from services.qft_service import get_qft_cases, pad_signal


generated = []
errors = []


def next_power_of_two(n):
    return 1 << (n - 1).bit_length() if n > 1 else 1


def cooley_tukey_radix2_steps(signal):
    steps = [{'name': 'input', 'signal': signal.copy()}]
    even = signal[0::2]
    odd = signal[1::2]
    steps.append({'name': 'split_even_odd', 'even': even, 'odd': odd})
    even_fft = np.fft.fft(even)
    odd_fft = np.fft.fft(odd)
    steps.append({'name': 'fft_even', 'values': even_fft})
    steps.append({'name': 'fft_odd', 'values': odd_fft})

    combined = np.zeros(len(signal), dtype=complex)
    for k in range(len(signal) // 2):
        twiddle = np.exp(-2j * np.pi * k / len(signal))
        combined[k] = even_fft[k] + twiddle * odd_fft[k]
        combined[k + len(signal) // 2] = even_fft[k] - twiddle * odd_fft[k]
    steps.append({'name': 'butterfly', 'values': combined})
    return steps


def save_fig(fig, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    fig.savefig(path, bbox_inches='tight', dpi=150, facecolor='white')
    plt.close(fig)
    generated.append(path)


def plot_steps(steps, case_id, output_dir):
    base = os.path.join(output_dir, case_id)
    os.makedirs(base, exist_ok=True)

    signal = steps[0]['signal']
    fig, ax = plt.subplots(figsize=(8, 3))
    ax.stem(range(len(signal)), signal, basefmt='k-', linefmt='#0ea5a4', markerfmt='o')
    ax.set_title(f'Input signal - {case_id}')
    ax.set_xlabel('n (time domain)')
    ax.set_ylabel('amplitude')
    ax.grid(alpha=0.3)
    save_fig(fig, os.path.join(base, 'step_input.png'))

    even = steps[1]['even']
    odd = steps[1]['odd']
    fig, axes = plt.subplots(1, 2, figsize=(10, 3))
    axes[0].stem(range(len(even)), even, basefmt='k-', linefmt='#2563eb', markerfmt='o')
    axes[0].set_title('Even-index samples')
    axes[1].stem(range(len(odd)), odd, basefmt='k-', linefmt='#ef4444', markerfmt='o')
    axes[1].set_title('Odd-index samples')
    for ax in axes:
        ax.grid(alpha=0.3)
    save_fig(fig, os.path.join(base, 'step_split.png'))

    even_fft = steps[2]['values']
    odd_fft = steps[3]['values']
    fig, axes = plt.subplots(1, 2, figsize=(10, 3))
    axes[0].bar(range(len(even_fft)), np.abs(even_fft), color='#2563eb')
    axes[0].set_title('FFT(even) magnitude')
    axes[1].bar(range(len(odd_fft)), np.abs(odd_fft), color='#ef4444')
    axes[1].set_title('FFT(odd) magnitude')
    for ax in axes:
        ax.grid(alpha=0.3)
    save_fig(fig, os.path.join(base, 'step_subffts.png'))

    combined = steps[-1]['values']
    fig, axes = plt.subplots(1, 3, figsize=(12, 3))
    axes[0].bar(range(len(even_fft)), np.abs(even_fft), color='#2563eb')
    axes[0].set_title('Fe (even)')
    axes[1].bar(range(len(odd_fft)), np.abs(odd_fft), color='#ef4444')
    axes[1].set_title('Fo (odd)')
    axes[2].bar(range(len(combined)), np.abs(combined), color='#10b981')
    axes[2].set_title('Combined FFT magnitude')
    for ax in axes:
        ax.grid(alpha=0.3)
    save_fig(fig, os.path.join(base, 'step_butterfly_and_result.png'))


def process_qft_case(case, output_dir):
    case_id = case.get('case_id', 'unknown')
    try:
        signal = [float(value) for value in case.get('signal_data', [])]
        if not signal:
            raise ValueError('signal_data is required')
        declared_points = int(case.get('n_points', len(signal)))
        signal = pad_signal(signal, declared_points)
        padded = pad_signal(signal, next_power_of_two(len(signal)))
        plot_steps(cooley_tukey_radix2_steps(padded), case_id, output_dir)
    except Exception as exc:
        errors.append(f'{case_id}: {exc}')


def main():
    parser = argparse.ArgumentParser(description='Generate FFT step images from QFT dataset JSON cases.')
    parser.add_argument('--output-dir', default=os.path.join('generated', 'fft'))
    args = parser.parse_args()

    cases = get_qft_cases()
    if not cases:
        errors.append('No QFT dataset cases found')
    for case in cases:
        process_qft_case(case, args.output_dir)

    print('GENERATED:', generated)
    print('ERRORS:', errors)


if __name__ == '__main__':
    main()
