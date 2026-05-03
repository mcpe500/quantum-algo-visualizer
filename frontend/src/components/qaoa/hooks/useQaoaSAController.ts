/**
 * Controller hook for QAOA Simulated Annealing.
 * Bridges React state with the engine layer.
 */

import { useMemo, useState, useCallback } from 'react';
import type { QAOABenchmarkResult } from '../../../types/qaoa';
import {
  type Matrix,
  type SimulationConfig,
  type SimulatedAnnealingResult,
  type JsonPayload,
  type QaoaSAVisualModel,
  buildQaoaSAVisualModel,
  simulate,
  validateMatrix,
  toMatrix,
  getMatrixFromPayload,
  createTemplateFromResult,
} from '../../../engine/qaoa/simulated-annealing';

export interface QaoaSAFormState {
  jsonInput: string;
  initialTemperature: string;
  alpha: string;
  minTemperature: string;
  maxSteps: string;
  seed: string;
}

export interface QaoaSAControllerState {
  model: QaoaSAVisualModel | null;
  form: QaoaSAFormState;
  error: string;
  isDirty: boolean;
}

export interface QaoaSAControllerActions {
  setForm: (patch: Partial<QaoaSAFormState>) => void;
  run: () => void;
  reset: () => void;
}

const DEFAULT_FORM: QaoaSAFormState = {
  jsonInput: '',
  initialTemperature: '3.0',
  alpha: '0.5',
  minTemperature: '0.1',
  maxSteps: '20',
  seed: '42',
};

function validateFormAndBuildConfig(form: QaoaSAFormState, matrix: Matrix): SimulationConfig {
  const initialTemperature = Number(form.initialTemperature);
  const alpha = Number(form.alpha);
  const minTemperature = Number(form.minTemperature);
  const maxSteps = Number(form.maxSteps);
  const seed = Number(form.seed);

  if (!(initialTemperature > 0)) throw new Error('T Awal harus lebih besar dari 0.');
  if (!(alpha > 0 && alpha < 1)) throw new Error('Cooling rate alpha harus di antara 0 dan 1.');
  if (!(minTemperature > 0)) throw new Error('T Minimum harus lebih besar dari 0.');
  if (!(Number.isInteger(maxSteps) && maxSteps > 0)) throw new Error('Max Step Limit harus bilangan bulat positif.');
  if (!Number.isFinite(seed)) throw new Error('Seed harus berupa angka.');

  return { matrix, initialTemperature, alpha, minTemperature, maxSteps, seed };
}

export function useQaoaSAController(result: QAOABenchmarkResult) {
  const defaultTemplate = useMemo(() => createTemplateFromResult(result), [result]);

  const [jsonInput, setJsonInput] = useState(defaultTemplate);
  const [initialTemperature, setInitialTemperature] = useState(DEFAULT_FORM.initialTemperature);
  const [alpha, setAlpha] = useState(DEFAULT_FORM.alpha);
  const [minTemperature, setMinTemperature] = useState(DEFAULT_FORM.minTemperature);
  const [maxSteps, setMaxSteps] = useState(DEFAULT_FORM.maxSteps);
  const [seed, setSeed] = useState(DEFAULT_FORM.seed);
  const [simulationResult, setSimulationResult] = useState<SimulatedAnnealingResult | null>(null);
  const [matrix, setMatrix] = useState<Matrix>(result.adjacency_matrix);
  const [description, setDescription] = useState(result.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
  const [error, setError] = useState('');

  const model = useMemo(() => {
    if (!simulationResult || !matrix.length) return null;
    return buildQaoaSAVisualModel(matrix, simulationResult, description);
  }, [simulationResult, matrix, description]);

  const form: QaoaSAFormState = useMemo(
    () => ({
      jsonInput,
      initialTemperature,
      alpha,
      minTemperature,
      maxSteps,
      seed,
    }),
    [jsonInput, initialTemperature, alpha, minTemperature, maxSteps, seed]
  );

  const setForm = useCallback((patch: Partial<QaoaSAFormState>) => {
    if (patch.jsonInput !== undefined) setJsonInput(patch.jsonInput);
    if (patch.initialTemperature !== undefined) setInitialTemperature(patch.initialTemperature);
    if (patch.alpha !== undefined) setAlpha(patch.alpha);
    if (patch.minTemperature !== undefined) setMinTemperature(patch.minTemperature);
    if (patch.maxSteps !== undefined) setMaxSteps(patch.maxSteps);
    if (patch.seed !== undefined) setSeed(patch.seed);
  }, []);

  const run = useCallback(() => {
    try {
      const payload = JSON.parse(jsonInput) as JsonPayload;
      const nextMatrix = toMatrix(getMatrixFromPayload(payload));
      validateMatrix(nextMatrix);

      const config = validateFormAndBuildConfig(form, nextMatrix);

      setMatrix(nextMatrix);
      setDescription(payload.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
      setSimulationResult(simulate(config));
      setError('');
    } catch (err) {
      setSimulationResult(null);
      setError(err instanceof Error ? err.message : 'Format JSON tidak valid.');
    }
  }, [jsonInput, form]);

  const reset = useCallback(() => {
    setJsonInput(defaultTemplate);
    setInitialTemperature(DEFAULT_FORM.initialTemperature);
    setAlpha(DEFAULT_FORM.alpha);
    setMinTemperature(DEFAULT_FORM.minTemperature);
    setMaxSteps(DEFAULT_FORM.maxSteps);
    setSeed(DEFAULT_FORM.seed);
    setMatrix(result.adjacency_matrix);
    setDescription(result.description || 'Penyelesaian Max-Cut dengan Graph Dinamis');
    setSimulationResult(null);
    setError('');
  }, [defaultTemplate, result]);

  return {
    state: {
      model,
      form,
      error,
      isDirty: jsonInput !== defaultTemplate,
    },
    actions: {
      setForm,
      run,
      reset,
    },
  };
}
