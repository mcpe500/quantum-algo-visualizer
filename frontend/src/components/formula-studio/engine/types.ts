import type { ComputationStep } from '../types';

export type BinaryOperator = '+' | '-' | '*' | '/' | '^';
export type UnaryOperator = '-';

export type ExprNode =
  | { kind: 'NumberLiteral'; value: number }
  | { kind: 'Symbol'; name: string }
  | { kind: 'UnaryExpression'; operator: UnaryOperator; argument: ExprNode }
  | {
      kind: 'BinaryExpression';
      operator: BinaryOperator;
      left: ExprNode;
      right: ExprNode;
    }
  | { kind: 'FunctionCall'; name: string; args: ExprNode[] };

export interface EngineError {
  code:
    | 'TOKEN_INVALID'
    | 'PARSE_UNEXPECTED_TOKEN'
    | 'PARSE_UNBALANCED_PAREN'
    | 'PARSE_EMPTY'
    | 'EVAL_MISSING_SYMBOL'
    | 'EVAL_DIVISION_BY_ZERO'
    | 'EVAL_DOMAIN_ERROR'
    | 'EVAL_OVERFLOW'
    | 'STEP_INVALID';
  message: string;
  at?: number;
}

export type EngineResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: EngineError };

export interface EvaluationContext {
  variables?: Record<string, number>;
  constants?: Record<string, number>;
  functions?: Record<string, (...args: number[]) => number>;
}

export type StepInstructionKind = 'parse' | 'substitute' | 'simplify' | 'evaluate';

export interface SymbolicStepInstruction {
  kind: StepInstructionKind;
  expression?: string;
  variables?: Record<string, number>;
  explanation: string;
}

export interface SymbolicComputationPlan {
  requiresParams: string[];
  initialExpression: string;
  stepsPlan: SymbolicStepInstruction[];
}

export interface SymbolicExecutionOutput {
  steps: ComputationStep[];
  finalExpression: ExprNode;
  finalValue?: number;
}
