import type { QAOAAnimationPayload, QAOAAnimationStep } from '../../../types/qaoa';
import { getActiveCheckpoint } from './helpers';

export function buildHybridLoopModel(data: QAOAAnimationPayload, activeStep: QAOAAnimationStep) {
  const activeCheckpoint = getActiveCheckpoint(data.checkpoints, activeStep);
  const bestExpected = Math.max(...data.checkpoints.map((checkpoint) => checkpoint.expected_cut));
  const firstExpected = data.checkpoints[0]?.expected_cut ?? 0;

  return {
    intro: `QAOA memakai loop hybrid: optimizer klasik memilih parameter, sirkuit kuantum mengevaluasi expected cut, lalu hasilnya dipakai untuk memperbarui parameter berikutnya.`,
    activeCheckpoint,
    firstExpected,
    bestExpected,
  };
}
