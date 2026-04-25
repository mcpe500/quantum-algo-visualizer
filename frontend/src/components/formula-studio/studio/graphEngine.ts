/**
 * graphEngine.ts
 *
 * Provides live computation for the Studio canvas.
 *
 * Architecture (global scope model):
 * 1. All INPUT nodes publish their variable → value into a global varScope.
 * 2. All EXPRESSION and FORMULA nodes read from that varScope automatically.
 * 3. On every state change, computeGraph() is called and returns a Map<nodeId, NodeResult>.
 * 4. React components use this map to show computed results.
 */

import type { CanvasNodeData } from './canvas-types';
import { parseExpression, substituteSymbols, simplifyExpression, evaluateExpression, toInfix, toLatex } from '../engine';

export interface NodeResult {
  value?: number;
  valueDisplay?: string;
  simplified?: string;
  latex?: string;
  error?: string;
}

/** Build a global variable scope from all INPUT nodes on the canvas. */
export function buildVarScope(nodes: CanvasNodeData[]): Record<string, number> {
  const scope: Record<string, number> = {};
  for (const node of nodes) {
    if (node.kind === 'input' && node.varName && node.varName.trim()) {
      const val = Number(node.varValue ?? '');
      if (Number.isFinite(val)) {
        scope[node.varName.trim()] = val;
      }
    }
  }
  return scope;
}

/** Format a number for display — limits to 6 significant digits. */
function displayNumber(value: number): string {
  if (!Number.isFinite(value)) return 'NaN';
  if (Math.abs(value) >= 1e9 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
    return value.toExponential(4);
  }
  const rounded = parseFloat(value.toPrecision(7));
  return String(rounded);
}

/**
 * Evaluate a single math expression string against a variable scope.
 * Returns a NodeResult with value, human-readable simplified expression, and any error.
 */
export function evalExpression(expr: string, scope: Record<string, number>): NodeResult {
  if (!expr || !expr.trim()) {
    return { error: 'Ekspresi kosong.' };
  }

  const parseResult = parseExpression(expr.trim());
  if (!parseResult.ok) {
    return { error: `Error parse: ${parseResult.error.message}` };
  }

  const substituted = substituteSymbols(parseResult.value, scope);
  const simplified = simplifyExpression(substituted);
  const evalResult = evaluateExpression(simplified, { variables: scope });

  const simplifiedInfix = toInfix(simplified);
  const simplifiedLatex = toLatex(simplified);

  if (!evalResult.ok) {
    // Possibly missing variables — give a helpful message
    const msg = evalResult.error.message;
    return {
      simplified: simplifiedInfix,
      latex: simplifiedLatex,
      error: msg.includes("Missing value for symbol")
        ? `Variabel belum terdefinisi: ${simplifiedInfix}`
        : `Error evaluasi: ${msg}`,
    };
  }

  return {
    value: evalResult.value,
    valueDisplay: displayNumber(evalResult.value),
    simplified: simplifiedInfix,
    latex: simplifiedLatex,
  };
}

/**
 * Given the full canvas state, compute a result for every node.
 * INPUT nodes just echo their value.
 * EXPRESSION nodes evaluate from the global scope.
 * FORMULA nodes run their stepsPlan if they have computation + required params available.
 */
export function computeGraph(nodes: CanvasNodeData[]): Map<string, NodeResult> {
  const varScope = buildVarScope(nodes);
  const results = new Map<string, NodeResult>();

  for (const node of nodes) {
    if (node.kind === 'input') {
      const val = Number(node.varValue ?? '');
      if (node.varName && Number.isFinite(val)) {
        results.set(node.id, {
          value: val,
          valueDisplay: displayNumber(val),
        });
      } else {
        results.set(node.id, { error: 'Nilai tidak valid.' });
      }

    } else if (node.kind === 'expression') {
      if (!node.nodeExpression || !node.nodeExpression.trim()) {
        results.set(node.id, { error: '' }); // silent: no expression yet
      } else {
        results.set(node.id, evalExpression(node.nodeExpression, varScope));
      }

    } else if (node.kind === 'formula') {
      // Will be handled by the StudioCanvas using formula.computation directly
      // We still provide the varScope result here for formula nodes that have computation configs
      results.set(node.id, { value: undefined });
    }
  }

  return results;
}
