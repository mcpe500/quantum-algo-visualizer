import type { QAOAAnimationStep } from '../../../types/qaoa';

export function getStepHeadline(step: QAOAAnimationStep): string {
  switch (step.phase) {
    case 'optimizer':
      return 'Loop hybrid dimulai dari optimizer klasik.';
    case 'superposition':
      return 'Ansatz dibuka ke superposisi awal.';
    case 'cost':
      return 'Hamiltonian Ising menilai struktur graph edge-by-edge.';
    case 'mixer':
      return 'Mixer menjaga eksplorasi ruang solusi tetap berjalan.';
    case 'measurement':
      return 'State diukur menjadi distribusi bitstring.';
    case 'update':
      return 'Objective dipakai untuk memperbarui parameter.';
    default:
      return step.operation;
  }
}

export function getStepExplanation(step: QAOAAnimationStep): string {
  if (step.phase === 'cost' && step.edge) {
    return `Edge (${step.edge[0]}, ${step.edge[1]}) aktif. Jika kedua node berada di partisi berbeda, kontribusinya menaikkan nilai cut.`;
  }
  if (step.phase === 'mixer' && step.target_qubit !== undefined) {
    return `Rotasi mixer pada q${step.target_qubit} menggeser amplitudo kandidat solusi tanpa menghapus informasi cost layer sebelumnya.`;
  }
  return step.description;
}
