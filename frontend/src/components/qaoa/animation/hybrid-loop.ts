import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { getActiveCheckpoint } from './helpers';

export function buildHybridLoopModel(data: QAOAAnimationPayload, activeStep: QAOAAnimationStep) {
  const activeCheckpoint = getActiveCheckpoint(data.checkpoints, activeStep);
  const bestExpected = Math.max(...data.checkpoints.map((checkpoint) => checkpoint.expected_cut));
  const firstExpected = data.checkpoints[0]?.expected_cut ?? 0;

  return {
    intro: `QAOA adalah algoritma HYBRID: optimizer klasik memilih parameter (γ, β), sirkuit kuantum menyiapkan state |ψ(γ,β)⟩, lalu hasil pengukuran dipakai untuk memperbarui parameter secara iteratif hingga konvergen ke optimum aproksimasi.`,
    activeCheckpoint,
    firstExpected,
    bestExpected,
  };
}
