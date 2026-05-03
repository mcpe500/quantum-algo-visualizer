/**
 * Diagnostic system for engine validation and error reporting.
 * Collects and reports errors, warnings, and info messages during engine execution.
 */

export const DiagnosticSeverity = {
  Error: 'error',
  Warning: 'warning',
  Info: 'info',
} as const;

export type DiagnosticSeverity = typeof DiagnosticSeverity[keyof typeof DiagnosticSeverity];

export interface EngineDiagnostic {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  context?: Record<string, unknown>;
  timestamp?: string;
}

export class DiagnosticCollector {
  private diagnostics: EngineDiagnostic[] = [];

  add(diagnostic: EngineDiagnostic): void {
    this.diagnostics.push({
      ...diagnostic,
      timestamp: diagnostic.timestamp || new Date().toISOString(),
    });
  }

  error(code: string, message: string, context?: Record<string, unknown>): void {
    this.add({
      severity: DiagnosticSeverity.Error,
      code,
      message,
      context,
    });
  }

  warning(code: string, message: string, context?: Record<string, unknown>): void {
    this.add({
      severity: DiagnosticSeverity.Warning,
      code,
      message,
      context,
    });
  }

  info(code: string, message: string, context?: Record<string, unknown>): void {
    this.add({
      severity: DiagnosticSeverity.Info,
      code,
      message,
      context,
    });
  }

  getDiagnostics(): EngineDiagnostic[] {
    return [...this.diagnostics];
  }

  getErrors(): EngineDiagnostic[] {
    return this.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error);
  }

  getWarnings(): EngineDiagnostic[] {
    return this.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Warning);
  }

  hasErrors(): boolean {
    return this.getDiagnostics().some((d) => d.severity === DiagnosticSeverity.Error);
  }

  clear(): void {
    this.diagnostics = [];
  }

  merge(other: DiagnosticCollector): void {
    this.diagnostics.push(...other.getDiagnostics());
  }
}

export function createDiagnosticCollector(): DiagnosticCollector {
  return new DiagnosticCollector();
}
