import type { EngineError, EngineResult } from './types';

export function ok<T>(value: T): EngineResult<T> {
  return { ok: true, value };
}

export function fail<T>(error: EngineError): EngineResult<T> {
  return { ok: false, error };
}

export function toErrorStep(message: string) {
  return {
    step: 1,
    latex: '\\text{Error}',
    explanation: message,
    result: 'NaN',
  };
}
