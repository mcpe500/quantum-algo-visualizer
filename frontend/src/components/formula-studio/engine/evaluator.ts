import type { EngineResult, EvaluationContext, ExprNode } from './types';
import { fail, ok } from './errors';

const DEFAULT_CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const DEFAULT_FUNCTIONS: Record<string, (...args: number[]) => number> = {
  sqrt: (x: number) => Math.sqrt(x),
  abs: (x: number) => Math.abs(x),
  exp: (x: number) => Math.exp(x),
  ln: (x: number) => Math.log(x),
  log: (x: number) => Math.log10(x),
  sin: (x: number) => Math.sin(x),
  cos: (x: number) => Math.cos(x),
  tan: (x: number) => Math.tan(x),
  min: (...values: number[]) => Math.min(...values),
  max: (...values: number[]) => Math.max(...values),
  pow: (x: number, y: number) => Math.pow(x, y),
  mod: (x: number, y: number) => ((x % y) + y) % y,
};

function evalNode(node: ExprNode, context: Required<EvaluationContext>): EngineResult<number> {
  switch (node.kind) {
    case 'NumberLiteral':
      return ok(node.value);

    case 'Symbol': {
      if (Object.prototype.hasOwnProperty.call(context.variables, node.name)) {
        return ok(context.variables[node.name]);
      }
      if (Object.prototype.hasOwnProperty.call(context.constants, node.name)) {
        return ok(context.constants[node.name]);
      }
      return fail({
        code: 'EVAL_MISSING_SYMBOL',
        message: `Missing value for symbol '${node.name}'`,
      });
    }

    case 'UnaryExpression': {
      const arg = evalNode(node.argument, context);
      if (!arg.ok) return arg;
      return ok(-arg.value);
    }

    case 'BinaryExpression': {
      const left = evalNode(node.left, context);
      if (!left.ok) return left;
      const right = evalNode(node.right, context);
      if (!right.ok) return right;

      let value: number;
      switch (node.operator) {
        case '+':
          value = left.value + right.value;
          break;
        case '-':
          value = left.value - right.value;
          break;
        case '*':
          value = left.value * right.value;
          break;
        case '/':
          if (right.value === 0) {
            return fail({ code: 'EVAL_DIVISION_BY_ZERO', message: 'Division by zero' });
          }
          value = left.value / right.value;
          break;
        case '^':
          value = left.value ** right.value;
          break;
        default:
          value = Number.NaN;
      }

      if (!Number.isFinite(value)) {
        return fail({ code: 'EVAL_OVERFLOW', message: 'Numerical overflow or invalid result' });
      }
      return ok(value);
    }

    case 'FunctionCall': {
      const fn = context.functions[node.name];
      if (!fn) {
        return fail({
          code: 'EVAL_DOMAIN_ERROR',
          message: `Unknown function '${node.name}'`,
        });
      }

      const args: number[] = [];
      for (const argNode of node.args) {
        const argValue = evalNode(argNode, context);
        if (!argValue.ok) return argValue;
        args.push(argValue.value);
      }

      const value = fn(...args);
      if (!Number.isFinite(value)) {
        return fail({
          code: 'EVAL_DOMAIN_ERROR',
          message: `Function '${node.name}' produced invalid result`,
        });
      }
      return ok(value);
    }

    default:
      return fail({ code: 'EVAL_DOMAIN_ERROR', message: 'Unsupported expression node' });
  }
}

export function evaluateExpression(node: ExprNode, context: EvaluationContext = {}): EngineResult<number> {
  return evalNode(node, {
    variables: context.variables ?? {},
    constants: { ...DEFAULT_CONSTANTS, ...(context.constants ?? {}) },
    functions: { ...DEFAULT_FUNCTIONS, ...(context.functions ?? {}) },
  });
}
