/**
 * Visual Object Graph - unified visual model format.
 * Can be consumed by React, SVG, Canvas, export PDF, or video.
 */

export interface VisualObjectGraph<T = unknown> {
  id: string;
  title: string;
  description?: string;
  meta: VisualMeta;
  sections: VisualSection[];
  timeline?: TimelineModel;
  layout?: LayoutModel;
  diagnostics: EngineDiagnostic[];
}

export interface VisualMeta {
  algorithm: string;
  caseId: string;
  timestamp: string;
  version?: string;
  tags?: string[];
}

export interface VisualSection {
  id: string;
  kind:
    | 'metric-grid'
    | 'graph'
    | 'formula'
    | 'timeline'
    | 'chart'
    | 'circuit'
    | 'summary'
    | 'custom';
  title?: string;
  blocks: VisualBlock[];
}

export interface VisualBlock {
  id: string;
  kind:
    | 'text'
    | 'metric'
    | 'formula'
    | 'graph-state'
    | 'matrix'
    | 'probability-bars'
    | 'statevector'
    | 'bloch'
    | 'connector'
    | 'status';
  data: unknown;
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose' | 'violet';
}

export interface TimelineModel {
  totalSteps: number;
  checkpoints: number[];
  phases: PhaseModel[];
}

export interface PhaseModel {
  id: string;
  label: string;
  startStep: number;
  endStep: number;
  color: string;
}

export interface LayoutModel {
  nodes: LayoutNode[];
  connectors: Connector[];
}

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: unknown;
}

export interface Connector {
  from: string;
  to: string;
  style?: 'solid' | 'dashed' | 'arrow';
  color?: string;
}

export interface EngineDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  context?: Record<string, unknown>;
}

export function createVisualObjectGraph<T>(config: {
  id: string;
  title: string;
  description?: string;
  meta: VisualMeta;
  sections: VisualSection[];
  timeline?: TimelineModel;
  layout?: LayoutModel;
  diagnostics?: EngineDiagnostic[];
}): VisualObjectGraph<T> {
  return {
    id: config.id,
    title: config.title,
    description: config.description,
    meta: config.meta,
    sections: config.sections,
    timeline: config.timeline,
    layout: config.layout,
    diagnostics: config.diagnostics ?? [],
  };
}
