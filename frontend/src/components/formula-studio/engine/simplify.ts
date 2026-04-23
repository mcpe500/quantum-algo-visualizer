import type { ExprNode } from './types';
import { toInfix } from './print';

function isNumber(node: ExprNode): node is Extract<ExprNode, { kind: 'NumberLiteral' }> {
  return node.kind === 'NumberLiteral';
}

function foldBinary(operator: string, left: number, right: number): number {
  switch (operator) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      return left / right;
    case '^':
      return left ** right;
    default:
      return Number.NaN;
  }
}

function simplifyOnce(node: ExprNode): ExprNode {
  switch (node.kind) {
    case 'NumberLiteral':
    case 'Symbol':
      return node;
    case 'UnaryExpression': {
      const arg = simplifyOnce(node.argument);
      if (arg.kind === 'NumberLiteral') {
        return { kind: 'NumberLiteral', value: -arg.value };
      }
      if (arg.kind === 'UnaryExpression' && arg.operator === '-') {
        return simplifyOnce(arg.argument);
      }
      return { ...node, argument: arg };
    }
    case 'FunctionCall':
      return { ...node, args: node.args.map((arg) => simplifyOnce(arg)) };
    case 'BinaryExpression': {
      const left = simplifyOnce(node.left);
      const right = simplifyOnce(node.right);

      if (isNumber(left) && isNumber(right)) {
        return { kind: 'NumberLiteral', value: foldBinary(node.operator, left.value, right.value) };
      }

      if (node.operator === '+') {
        if (isNumber(left) && left.value === 0) return right;
        if (isNumber(right) && right.value === 0) return left;
      }

      if (node.operator === '-') {
        if (isNumber(right) && right.value === 0) return left;
      }

      if (node.operator === '*') {
        if ((isNumber(left) && left.value === 0) || (isNumber(right) && right.value === 0)) {
          return { kind: 'NumberLiteral', value: 0 };
        }
        if (isNumber(left) && left.value === 1) return right;
        if (isNumber(right) && right.value === 1) return left;
      }

      if (node.operator === '/') {
        if (isNumber(left) && left.value === 0) return { kind: 'NumberLiteral', value: 0 };
        if (isNumber(right) && right.value === 1) return left;
      }

      if (node.operator === '^') {
        if (isNumber(right) && right.value === 0) return { kind: 'NumberLiteral', value: 1 };
        if (isNumber(right) && right.value === 1) return left;
        if (isNumber(left) && left.value === 1) return { kind: 'NumberLiteral', value: 1 };
      }

      return { ...node, left, right };
    }
    default:
      return node;
  }
}

export function simplifyExpression(node: ExprNode, maxPasses = 8): ExprNode {
  let current = node;
  for (let i = 0; i < maxPasses; i += 1) {
    const next = simplifyOnce(current);
    if (toInfix(next) === toInfix(current)) {
      return next;
    }
    current = next;
  }
  return current;
}

export function substituteSymbols(node: ExprNode, values: Record<string, number>): ExprNode {
  switch (node.kind) {
    case 'Symbol':
      if (Object.prototype.hasOwnProperty.call(values, node.name)) {
        return { kind: 'NumberLiteral', value: values[node.name] };
      }
      return node;
    case 'UnaryExpression':
      return { ...node, argument: substituteSymbols(node.argument, values) };
    case 'BinaryExpression':
      return {
        ...node,
        left: substituteSymbols(node.left, values),
        right: substituteSymbols(node.right, values),
      };
    case 'FunctionCall':
      return { ...node, args: node.args.map((arg) => substituteSymbols(arg, values)) };
    default:
      return node;
  }
}
