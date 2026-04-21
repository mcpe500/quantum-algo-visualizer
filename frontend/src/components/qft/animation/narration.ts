import type { QFTAnimationStep } from '../../../types/qft';

export function getStepHeadline(step: QFTAnimationStep): string {
  switch (step.phase) {
    case 'init':
      return 'Amplitude Encoding';
    case 'phase_cascade':
      return 'Controlled Phase Rotation';
    case 'hadamard':
      return 'Hadamard Gate';
    case 'swap':
      return 'SWAP Gate (Bit Reversal)';
    case 'measurement':
      return 'Measurement';
    default:
      return step.operation;
  }
}

export function getStepExplanation(step: QFTAnimationStep): string {
  switch (step.phase) {
    case 'init':
      return 'Sampel sinyal dari dataset dinormalisasi lalu di-encode ke amplitude statevector. Jadi frame awal QFT bukan register |0...0>, melainkan state kuantum yang sudah membawa isi sinyal asli.';
    case 'phase_cascade':
      if (step.rotation_angle !== undefined) {
        return `Controlled rotation CR_{${step.control_qubit !== undefined && step.target_qubit !== undefined ? step.control_qubit - step.target_qubit : '?'}} menambahkan phase π/2^{${step.control_qubit !== undefined && step.target_qubit !== undefined ? step.control_qubit - step.target_qubit : '?'}} pada qubit target q${step.target_qubit} dikendalikan oleh q${step.control_qubit}. Phase accumulator: ${formatRadians(step.rotation_angle)}.`;
      }
      return 'Controlled phase gates menambahkan rotation pada qubit target berdasarkan state qubit control. Ini adalah operasi fundamental QFT untuk akumulasi phase.';
    case 'hadamard':
      return 'Hadamard pada qubit target mengubah akumulasi fase menjadi interferensi yang relevan untuk basis Fourier. Inilah tahap yang membantu pola frekuensi muncul pada state akhir.';
    case 'swap':
      return 'SWAP gates memperbaiki bit-reversed ordering. Output QFT secara alami dalam urutan bit-reversed; SWAP diperlukan untuk mendapatkan urutan frekuensi natural.';
    case 'measurement':
      return 'Pengukuran collapsing state ke basis komputasi, menghasilkan probability distribution pada frequency domain. Bin dengan probabilitas tertinggi correspond ke frequency dominan dalam sinyal.';
    default:
      return step.description;
  }
}

export function getContextGlossary(step: QFTAnimationStep, nQubits: number): string[] {
  const notes: string[] = [];

  if (step.qubit_phases && step.qubit_phases.length > 0) {
    const phaseInfo = step.qubit_phases
      .map((phase, i) => `q${i}: ${formatRadians(phase)}`)
      .join(', ');
    notes.push(`Phase per qubit: ${phaseInfo}`);
  }

  if (step.phase === 'phase_cascade' && step.rotation_angle !== undefined) {
    notes.push(`Rotation angle: ${formatRadians(step.rotation_angle)} (π/${(Math.PI / step.rotation_angle).toFixed(1)})`);
  }

  if (step.phase === 'swap' && step.swap_pair) {
    notes.push(`SWAP pair: q${step.swap_pair[0]} ↔ q${step.swap_pair[1]}`);
  }

  if (step.probabilities && step.probabilities.length > 0) {
    const maxProb = Math.max(...step.probabilities);
    const dominantIdx = step.probabilities.indexOf(maxProb);
    notes.push(`Dominant state: |${dominantIdx.toString(2).padStart(nQubits, '0')}⟩ with ${(maxProb * 100).toFixed(1)}%`);
  }

  return notes;
}

function formatRadians(radians: number) {
  const degrees = (radians * 180) / Math.PI;
  return `${degrees.toFixed(1)}°`;
}
