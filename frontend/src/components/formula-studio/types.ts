// Formula Category
export type FormulaCategory = 'basics' | 'gates' | 'dj' | 'qft' | 'vqe' | 'qaoa' | 'sa' | 'complexity' | 'state-representation' | 'equations' | 'foundational';

// Variable definition within a formula
export interface FormulaVariable {
  symbol: string;
  name: string;
  description: string;
}

// Formula relation / connection
export interface FormulaRelation {
  targetId: string;
  type: 'quantum-version' | 'implements' | 'derives' | 'compares' | 'generalizes' | 'same-concept' | 'related' | 'equivalent' | 'derived-from' | 'specializes' | 'contrast-with' | 'discretized' | 'encoded-in' | 'quantized' | 'uses' | 'algorithm' | 'target' | 'computed-by' | 'result' | 'used-in';
  label: string;  // e.g. "is the quantum version of"
}

// Step in step-by-step computation
export interface ComputationStep {
  step: number;
  latex: string;
  explanation: string;
  result?: string;
}

// Computation function for step-by-step
export interface ComputationConfig {
  requiresParams: string[];
  /** Human-readable math expression used by the engine, e.g. "n*(n+1)/2" (NOT LaTeX). */
  expression?: string;
  steps: (params: any) => ComputationStep[];
}

// The main formula definition
export interface FormulaDefinition {
  id: string;
  latex: string;
  title: string;
  category: FormulaCategory;
  tags: string[];  // for search: synonyms, related terms
  chapter: string[];  // which thesis chapters reference this: ["2", "4", "5"]
  description: string;  // Academic Indonesian explanation
  variables?: FormulaVariable[];
  relatedFormulas: FormulaRelation[];
  computation?: ComputationConfig;
}

// Canvas node (formula placed on canvas)
export interface CanvasFormula extends FormulaDefinition {
  position: { x: number; y: number };
}

// Canvas connection (between two formulas)
export interface CanvasConnection {
  id: string;
  fromId: string;
  toId: string;
  relationType: string;
  label: string;
  fromPort?: string;
  toPort?: string;
}

// Story narrative step
export interface StoryStep {
  formulaId: string;
  title: string;
  connectingText: string;  // e.g. "The Hadamard gate creates superposition"
  highlight?: string;  // which part of the formula to highlight
}

// Pre-built story narrative
export interface FormulaStory {
  id: string;
  title: string;
  algorithm: 'dj' | 'qft' | 'vqe' | 'qaoa' | 'gates';
  steps: StoryStep[];
}

// Search result
export interface SearchResult {
  formula: FormulaDefinition;
  score: number;
  matchedOn: ('id' | 'title' | 'latex' | 'tags' | 'category')[];
}
