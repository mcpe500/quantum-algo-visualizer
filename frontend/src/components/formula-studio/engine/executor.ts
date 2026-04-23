import type { ComputationConfig, ComputationStep } from '../types';
import { parseExpression } from './parser';
import { toLatex } from './print';
import { substituteSymbols, simplifyExpression } from './simplify';
import { evaluateExpression } from './evaluator';
import type { EngineResult, ExprNode, SymbolicComputationPlan } from './types';
import { fail, ok, toErrorStep } from './errors';

function numberToDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'NaN';
  if (Math.abs(value) >= 1e6 || (Math.abs(value) > 0 && Math.abs(value) < 1e-4)) {
    return value.toExponential(6);
  }
  return value.toFixed(6).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

export function executeSymbolicPlan(
  plan: SymbolicComputationPlan,
  params: Record<string, number>
): EngineResult<{ steps: ComputationStep[]; finalExpression: ExprNode; finalValue?: number }> {
  const parseResult = parseExpression(plan.initialExpression);
  if (!parseResult.ok) {
    return fail({
      code: 'STEP_INVALID',
      message: `Failed to parse initial expression: ${parseResult.error.message}`,
    });
  }

  let currentExpression = parseResult.value;
  let finalValue: number | undefined;
  const steps: ComputationStep[] = [];

  for (let i = 0; i < plan.stepsPlan.length; i += 1) {
    const instruction = plan.stepsPlan[i];

    if (instruction.kind === 'parse') {
      const src = instruction.expression ?? plan.initialExpression;
      const parsed = parseExpression(src);
      if (!parsed.ok) {
        return fail({
          code: 'STEP_INVALID',
          message: `Step ${i + 1} parse failed: ${parsed.error.message}`,
        });
      }
      currentExpression = parsed.value;
    }

    if (instruction.kind === 'substitute') {
      const values = { ...params, ...(instruction.variables ?? {}) };
      currentExpression = substituteSymbols(currentExpression, values);
    }

    if (instruction.kind === 'simplify') {
      currentExpression = simplifyExpression(currentExpression);
    }

    if (instruction.kind === 'evaluate') {
      const evalResult = evaluateExpression(currentExpression, {
        variables: { ...params, ...(instruction.variables ?? {}) },
      });
      if (!evalResult.ok) {
        return fail({
          code: 'STEP_INVALID',
          message: `Step ${i + 1} evaluate failed: ${evalResult.error.message}`,
        });
      }
      finalValue = evalResult.value;
      currentExpression = { kind: 'NumberLiteral', value: evalResult.value };
    }

    steps.push({
      step: i + 1,
      latex: toLatex(currentExpression),
      explanation: instruction.explanation,
      result: finalValue !== undefined ? numberToDisplay(finalValue) : undefined,
    });
  }

  return ok({ steps, finalExpression: currentExpression, finalValue });
}

export function createSymbolicComputationConfig(plan: SymbolicComputationPlan): ComputationConfig {
  return {
    requiresParams: plan.requiresParams,
    steps: (params: Record<string, number>) => {
      const result = executeSymbolicPlan(plan, params);
      if (!result.ok) {
        return [toErrorStep(result.error.message)];
      }
      return result.value.steps;
    },
  };
}
