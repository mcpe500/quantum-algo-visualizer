/**
 * Validation logic for QAOA Simulated Annealing engine.
 * Validates matrix parsing and configuration inputs.
 */

import type { SimulationConfig, ConfigError } from './domain';
import {
  createConfigError,
} from './domain';

export function validateConfig(config: unknown): SimulationConfig | ConfigError {
  if (!config || typeof config !== 'object') {
    return createConfigError('Config must be an object', 'INVALID_CONFIG_TYPE');
  }

  const cfg = config as Partial<SimulationConfig>;

  if (typeof cfg.matrix === 'undefined') {
    return createConfigError('Matrix is required', 'MISSING_MATRIX');
  }

  if (typeof cfg.initialTemperature !== 'number' || cfg.initialTemperature <= 0) {
    return createConfigError('Initial temperature must be a positive number', 'INVALID_INITIAL_TEMP');
  }

  if (typeof cfg.alpha !== 'number' || cfg.alpha <= 0 || cfg.alpha > 1) {
    return createConfigError('Alpha must be between 0 and 1', 'INVALID_ALPHA');
  }

  if (typeof cfg.minTemperature !== 'number' || cfg.minTemperature < 0) {
    return createConfigError('Min temperature must be non-negative', 'INVALID_MIN_TEMP');
  }

  if (typeof cfg.maxSteps !== 'number' || cfg.maxSteps <= 0) {
    return createConfigError('Max steps must be a positive number', 'INVALID_MAX_STEPS');
  }

  if (typeof cfg.seed !== 'number' || cfg.seed < 0) {
    return createConfigError('Seed must be a non-negative number', 'INVALID_SEED');
  }

  return cfg as SimulationConfig;
}
