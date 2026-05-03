/**
 * Engine Core - foundational modules for quantum algorithm visualization engines.
 * Provides shared types, utilities, and patterns used across domain-specific engines.
 */

// Result types
export type { BenchmarkResult, ResultMetadata, ValidationResult, ValidationError } from './result';
export { createValidationError, createValidationResult } from './result';

// Diagnostics
export type { DiagnosticSeverity, EngineDiagnostic } from './diagnostics';
export { DiagnosticCollector, createDiagnosticCollector } from './diagnostics';

// Playback
export type { PlaybackState, PlaybackAction } from './playback';
export { playbackReducer, createInitialPlaybackState } from './playback';

// Visual Object Graph
export type {
  VisualObjectGraph,
  VisualMeta,
  VisualSection,
  VisualBlock,
  TimelineModel,
  PhaseModel,
  EngineDiagnostic as VOGDiagnostic,
} from './visual-object-graph';
export { createVisualObjectGraph } from './visual-object-graph';

// Layout
export type { LayoutNode, Connector, LayoutModel, FlowLayoutConfig } from './layout';
export {
  buildSerpentineFlowLayout,
  buildGridLayout,
  calculateDesktopLayout,
  createConnector,
  buildConnectorsFromLayout,
} from './layout';
