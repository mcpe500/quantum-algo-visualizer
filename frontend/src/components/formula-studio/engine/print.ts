import type { ExprNode } from './types';

function precedence(node: ExprNode): number {
  if (node.kind === 'BinaryExpression') {
    if (node.operator === '+' || node.operator === '-') return 1;
    if (node.operator === '*' || node.operator === '/' || node.operator === '⊗') return 2;
    if (node.operator === '^') return 3;
  }
  if (node.kind === 'UnaryExpression') return 4;
  return 5;
}

function wrapIfNeeded(node: ExprNode, parentPrec: number, isRight = false): string {
  const value = toInfix(node);
  const nodePrec = precedence(node);
  const needsWrap = nodePrec < parentPrec || (isRight && node.kind === 'BinaryExpression' && node.operator === '^');
  return needsWrap ? `(${value})` : value;
}

export function toInfix(node: ExprNode): string {
  switch (node.kind) {
    case 'NumberLiteral':
      return Number.isInteger(node.value) ? `${node.value}` : `${node.value}`;
    case 'Symbol':
      return node.name;
    case 'UnaryExpression':
      return `-${wrapIfNeeded(node.argument, precedence(node))}`;
    case 'BinaryExpression': {
      const prec = precedence(node);
      const left = wrapIfNeeded(node.left, prec);
      const right = wrapIfNeeded(node.right, prec, true);
      return `${left}${node.operator}${right}`;
    }
    case 'FunctionCall':
      return `${node.name}(${node.args.map((arg) => toInfix(arg)).join(',')})`;
    default:
      return '';
  }
}

export function toLatex(node: ExprNode): string {
  switch (node.kind) {
    case 'NumberLiteral':
      return Number.isInteger(node.value) ? `${node.value}` : `${node.value}`;
    case 'Symbol':
      return node.name;
    case 'UnaryExpression':
      return `-${toLatex(node.argument)}`;
    case 'BinaryExpression': {
      if (node.operator === '/') {
        return `\\frac{${toLatex(node.left)}}{${toLatex(node.right)}}`;
      }
      if (node.operator === '^') {
        return `{${toLatex(node.left)}}^{${toLatex(node.right)}}`;
      }
      if (node.operator === '*') {
        return `${toLatex(node.left)} \\cdot ${toLatex(node.right)}`;
      }
      if (node.operator === '⊗') {
        return `${toLatex(node.left)} \\otimes ${toLatex(node.right)}`;
      }
      return `${toLatex(node.left)} ${node.operator} ${toLatex(node.right)}`;
    }
    case 'FunctionCall': {
      if (node.name === 'sqrt' && node.args.length === 1) {
        return `\\sqrt{${toLatex(node.args[0])}}`;
      }
      const fnName = node.name === 'ln' ? '\\ln' : node.name === 'log' ? '\\log' : node.name;
      return `${fnName}\left(${node.args.map((arg) => toLatex(arg)).join(', ')}\\right)`;
    }
    default:
      return '';
  }
}
