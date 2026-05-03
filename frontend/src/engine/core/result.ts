/**
 * Core result types for quantum algorithm benchmark results.
 * Generic interfaces to be used across all algorithm implementations.
 */

export interface BenchmarkResult<T = unknown> {
  case_id: string;
  algorithm: string;
  timestamp?: string;
  data: T;
}

export interface ResultMetadata {
  case_id: string;
  timestamp: string;
  algorithm: string;
  version?: string;
}

export interface ValidationResult<T = unknown> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export function createValidationError(field: string, message: string, code: string): ValidationError {
  return { field, message, code };
}

export function createValidationResult<T>(
  isValid: boolean,
  data?: T,
  errors: ValidationError[] = []
): ValidationResult<T> {
  return { isValid, data, errors };
}
