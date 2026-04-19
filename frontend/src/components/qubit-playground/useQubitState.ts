import { useState, useCallback } from 'react';
import type { QubitState, GateDefinition } from './constants';
import { PRESET_STATES, applyGate } from './constants';

export function useQubitState() {
  const [state, setState] = useState<QubitState>(PRESET_STATES[0]);
  const [history, setHistory] = useState<QubitState[]>([PRESET_STATES[0]]);

  const setPreset = useCallback((index: number) => {
    const preset = PRESET_STATES[index];
    setState(preset);
    setHistory((prev) => [...prev, preset]);
  }, []);

  const applyGateToState = useCallback((gate: GateDefinition) => {
    setState((prev) => {
      const newState = applyGate(prev, gate);
      setHistory((h) => [...h, newState]);
      return newState;
    });
  }, []);

  const reset = useCallback(() => {
    setState(PRESET_STATES[0]);
    setHistory([PRESET_STATES[0]]);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      setState(newHistory[newHistory.length - 1]);
      return newHistory;
    });
  }, []);

  const pZero = state.alpha.re ** 2 + state.alpha.im ** 2;
  const pOne = state.beta.re ** 2 + state.beta.im ** 2;

  return {
    state,
    history,
    pZero,
    pOne,
    setPreset,
    applyGate: applyGateToState,
    reset,
    undo,
  };
}
