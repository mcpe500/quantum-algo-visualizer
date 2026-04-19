import { useState, useCallback, useMemo } from 'react';
import type { Complex } from './types';
import {
  H, X, Y, Z, S, T, Rx, Ry, Rz, CNOT, CPhase, SWAP,
  embedGate1Q, embedGate2Q, applyGateToState, getInitialState,
  blochCoords, marginalProb, SCENARIOS,
} from './constants';

export interface QubitPlaygroundState {
  numQubits: number;
  statevector: Complex[];
  history: Complex[][];
  blochData: BlochData[];
}

export interface BlochData {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  pZero: number;
  pOne: number;
}

const SINGLE_GATE_FUNCTIONS: { [key: string]: Complex[][] } = { H, X, Y, Z, S, T };
const PARAMETRIC_GATE_FUNCTIONS: { [key: string]: (theta: number) => Complex[][] } = { Rx, Ry, Rz };
const TWO_QUBIT_GATE_FUNCTIONS: { [key: string]: (theta?: number) => Complex[][] } = {
  CNOT: () => CNOT,
  SWAP: () => SWAP,
  CPhase: (theta?: number) => CPhase(theta || 0),
};

export function useQubitState() {
  const [numQubits, setNumQubitsState] = useState<number>(2);
  const [statevector, setStatevector] = useState<Complex[]>(() => getInitialState(2));
  const [history, setHistory] = useState<Complex[][]>([[...getInitialState(2)]]);

  const blochData = useMemo<BlochData[]>(() => {
    return Array.from({ length: numQubits }, (_, i) => {
      const coords = blochCoords(statevector, i, numQubits);
      const probs = marginalProb(statevector, i, numQubits);
      return { ...coords, pZero: probs.pZero, pOne: probs.pOne };
    });
  }, [statevector, numQubits]);

  const setNumQubits = useCallback((n: number) => {
    const clampedN = Math.max(1, Math.min(3, n));
    const newState = getInitialState(clampedN);
    setNumQubitsState(clampedN);
    setStatevector(newState);
    setHistory([newState]);
  }, []);

  const applySingleGate = useCallback(
    (gateName: string, targetQubit: number, angle?: number) => {
      setHistory((prev) => [...prev, [...statevector]]);

      let gateMatrix: Complex[][];

      if (SINGLE_GATE_FUNCTIONS[gateName]) {
        gateMatrix = SINGLE_GATE_FUNCTIONS[gateName];
      } else if (PARAMETRIC_GATE_FUNCTIONS[gateName]) {
        const paramGate = PARAMETRIC_GATE_FUNCTIONS[gateName];
        gateMatrix = angle !== undefined ? paramGate(angle) : paramGate(0);
      } else {
        return;
      }

      const embedded = embedGate1Q(gateMatrix, targetQubit, numQubits);
      const newState = applyGateToState(statevector, embedded);
      setStatevector(newState);
    },
    [statevector, numQubits]
  );

  const applyTwoQubitGate = useCallback(
    (gateName: string, control: number, target: number, angle?: number) => {
      if (control === target) return;
      if (control < 0 || control >= numQubits) return;
      if (target < 0 || target >= numQubits) return;

      setHistory((prev) => [...prev, [...statevector]]);

      let gateMatrix: Complex[][];

      if (TWO_QUBIT_GATE_FUNCTIONS[gateName]) {
        gateMatrix = TWO_QUBIT_GATE_FUNCTIONS[gateName](angle);
      } else {
        return;
      }

      const embedded = embedGate2Q(gateMatrix, control, target, numQubits);
      const newState = applyGateToState(statevector, embedded);
      setStatevector(newState);
    },
    [statevector, numQubits]
  );

  const loadScenario = useCallback(
    (scenarioIndex: number) => {
      if (scenarioIndex < 0 || scenarioIndex >= SCENARIOS.length) return;

      const scenario = SCENARIOS[scenarioIndex];
      let currentState = [...statevector];
      const newHistory = [[...currentState]];

      for (const step of scenario.steps) {
        const { gate, targets, angle } = step;

        if (gate === 'CNOT' || gate === 'SWAP' || gate === 'CPhase') {
          if (targets.length >= 2) {
            const embedded = embedGate2Q(
              gate === 'CPhase' ? CPhase(angle || 0) : gate === 'CNOT' ? CNOT : SWAP,
              targets[0],
              targets[1],
              numQubits
            );
            currentState = applyGateToState(currentState, embedded);
          }
        } else if (targets.length > 0) {
          let gateMatrix: Complex[][];

          if (SINGLE_GATE_FUNCTIONS[gate]) {
            gateMatrix = SINGLE_GATE_FUNCTIONS[gate];
          } else if (PARAMETRIC_GATE_FUNCTIONS[gate]) {
            gateMatrix = PARAMETRIC_GATE_FUNCTIONS[gate](angle || 0);
          } else {
            continue;
          }

          const embedded = embedGate1Q(gateMatrix, targets[0], numQubits);
          currentState = applyGateToState(currentState, embedded);
        }

        newHistory.push([...currentState]);
      }

      setHistory(newHistory);
      setStatevector(currentState);
    },
    [statevector, numQubits]
  );

  const reset = useCallback(() => {
    const newState = getInitialState(numQubits);
    setStatevector(newState);
    setHistory([newState]);
  }, [numQubits]);

  const undo = useCallback(() => {
    if (history.length <= 1) return;

    const newHistory = [...history];
    newHistory.pop();

    setHistory(newHistory);
    setStatevector([...newHistory[newHistory.length - 1]]);
  }, [history]);

  return {
    numQubits,
    statevector,
    history,
    blochData,
    setNumQubits,
    applySingleGate,
    applyTwoQubitGate,
    loadScenario,
    reset,
    undo,
  };
}