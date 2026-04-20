export { clamp, wait, waitForAnimationFrame, waitForAnimationFrames, waitForCanvasReady, getColumnLayout, formatPercent } from '../../../shared/utils';
export { formatRadians, formatComplex, radiansToDegrees, degreesToRadians, normalizeAngle } from '../../../shared/utils';
import { getLaneYs as sharedGetLaneYs } from '../../../shared/utils';

export function getLaneYs(nQubits: number) {
  return sharedGetLaneYs(nQubits);
}
