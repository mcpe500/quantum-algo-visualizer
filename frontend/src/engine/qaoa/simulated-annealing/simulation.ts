/**
 * QAOA Simulated Annealing simulation engine.
 * Pure domain logic - no React, no DOM.
 */

import { formatNumber, calcCutDetails, flipOneBit, createSeededRandom } from './utils';
import type { SimulationConfig, SimulatedAnnealingResult, TraceStep, StatusColor } from './domain';

export function simulate({ matrix, initialTemperature, alpha, minTemperature, maxSteps, seed }: SimulationConfig): SimulatedAnnealingResult {
  const n = matrix.length;
  const random = createSeededRandom(seed);
  let currentBits = Array(n).fill(0) as number[];
  let currentTemperature = initialTemperature;
  let currentCut = calcCutDetails(matrix, currentBits).cut;
  let best = { state: currentBits.join(''), cut: currentCut, step: 0 };
  const trace: TraceStep[] = [];

  trace.push({
    step: 0,
    action: 'Kondisi Awal',
    temperature: currentTemperature,
    newTemperature: null,
    minTemperature,
    currentState: currentBits.join(''),
    candidateState: currentBits.join(''),
    resultState: currentBits.join(''),
    currentCut,
    candidateCut: currentCut,
    resultCut: currentCut,
    deltaCut: 0,
    randomValue: null,
    probability: null,
    accepted: true,
    status: 'START',
    color: 'slate',
    stopAfter: false,
    cutDetails: calcCutDetails(matrix, currentBits),
  });

  let step = 1;
  let stoppedByTemperature = false;

  while (currentTemperature >= minTemperature && step <= maxSteps) {
    const flipNode = Math.floor(random() * n);
    const candidateBits = flipOneBit(currentBits, flipNode);
    const candidateCutDetails = calcCutDetails(matrix, candidateBits);
    const candidateCut = candidateCutDetails.cut;
    const deltaCut = candidateCut - currentCut;

    let accepted = false;
    let randomValue: number | null = null;
    let probability: number | null = null;
    let status = '';
    let color: StatusColor = 'slate';

    if (deltaCut >= 0) {
      accepted = true;
      status = 'ACCEPT (LEBIH BAIK / SAMA)';
      color = 'emerald';
    } else {
      probability = Math.exp(deltaCut / currentTemperature);
      randomValue = random();

      if (randomValue < probability) {
        accepted = true;
        status = 'ACCEPT (EKSPLORASI)';
        color = 'yellow';
      } else {
        accepted = false;
        status = 'REJECT (BURUK)';
        color = 'red';
      }
    }

    const previousState = currentBits.join('');
    const previousCut = currentCut;

    if (accepted) {
      currentBits = candidateBits;
      currentCut = candidateCut;

      if (currentCut > best.cut) {
        best = { state: currentBits.join(''), cut: currentCut, step };
      }
    }

    const newTemperature = currentTemperature * alpha;
    const stopAfter = newTemperature < minTemperature;

    trace.push({
      step,
      action: `Flip Node ${flipNode}`,
      flipNode,
      temperature: currentTemperature,
      newTemperature,
      minTemperature,
      currentState: previousState,
      candidateState: candidateBits.join(''),
      resultState: currentBits.join(''),
      currentCut: previousCut,
      candidateCut,
      resultCut: currentCut,
      deltaCut,
      randomValue,
      probability,
      accepted,
      status,
      color,
      stopAfter,
      cutDetails: candidateCutDetails,
    });

    if (stopAfter) {
      stoppedByTemperature = true;
      break;
    }

    currentTemperature = newTemperature;
    step += 1;
  }

  const lastStep = trace[trace.length - 1];
  const stopReason = stoppedByTemperature
    ? {
        type: 'temperature' as const,
        text: `Suhu telah melewati batas minimum: T_baru ${formatNumber(lastStep.newTemperature)} < T_min ${formatNumber(minTemperature)}. Algoritma berhenti karena sudah terlalu dingin untuk eksplorasi berikutnya.`,
      }
    : {
        type: 'maxStep' as const,
        text: `Simulasi berhenti karena mencapai Max Step Limit (${maxSteps} step).`,
      };

  return {
    trace,
    best,
    finalState: currentBits.join(''),
    finalCut: currentCut,
    stopReason,
  };
}
