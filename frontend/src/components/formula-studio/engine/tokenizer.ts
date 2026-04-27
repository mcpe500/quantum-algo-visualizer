import type { EngineResult } from './types';
import { fail, ok } from './errors';

export type TokenType =
  | 'number'
  | 'identifier'
  | 'operator'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  at: number;
}

interface BracedExpression {
  content: string;
  end: number;
}

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

function readBraced(source: string, start: number): BracedExpression | null {
  if (source[start] !== '{') return null;
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') depth -= 1;
    if (depth === 0) {
      return {
        content: source.slice(start + 1, i),
        end: i + 1,
      };
    }
  }
  return null;
}

function replaceLatexCommand(
  source: string,
  command: string,
  arity: 1 | 2,
  render: (first: string, second?: string) => string,
): string {
  let output = '';
  let index = 0;
  while (index < source.length) {
    const commandIndex = source.indexOf(command, index);
    if (commandIndex < 0) {
      output += source.slice(index);
      break;
    }

    output += source.slice(index, commandIndex);
    const first = readBraced(source, commandIndex + command.length);
    if (!first) {
      output += command;
      index = commandIndex + command.length;
      continue;
    }

    if (arity === 1) {
      output += render(first.content);
      index = first.end;
      continue;
    }

    const second = readBraced(source, first.end);
    if (!second) {
      output += command + source.slice(commandIndex + command.length, first.end);
      index = first.end;
      continue;
    }

    output += render(first.content, second.content);
    index = second.end;
  }
  return output;
}

function normalizeLatexSource(source: string): string {
  let normalized = source;
  for (let i = 0; i < 4; i += 1) {
    const before = normalized;
    normalized = replaceLatexCommand(normalized, '\\frac', 2, (top, bottom) => `((${top})/(${bottom}))`);
    normalized = replaceLatexCommand(normalized, '\\sqrt', 1, (value) => `sqrt(${value})`);
    if (normalized === before) break;
  }

  return normalized
    .replace(/\\left/g, '')
    .replace(/\\right/g, '')
    .replace(/\\cdot|\\times|·|×/g, '*')
    .replace(/\\otimes|⊗/g, '⊗')
    .replace(/\\sum/g, 'sum')
    .replace(/\\prod/g, 'prod')
    .replace(/\\pi|π/g, 'pi')
    .replace(/\\theta|θ/g, 'theta')
    .replace(/\\gamma|γ/g, 'gamma')
    .replace(/\\beta|β/g, 'beta')
    .replace(/\\alpha|α/g, 'alpha')
    .replace(/\\lambda|λ/g, 'lambda')
    .replace(/\\ket\{([^}]+)\}/g, 'ket_$1')
    .replace(/\\bra\{([^}]+)\}/g, 'bra_$1')
    .replace(/[{}]/g, '');
}

export function tokenizeExpression(source: string): EngineResult<Token[]> {
  const normalizedSource = normalizeLatexSource(source);
  const tokens: Token[] = [];
  let i = 0;

  while (i < normalizedSource.length) {
    const ch = normalizedSource[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (isDigit(ch) || (ch === '.' && i + 1 < normalizedSource.length && isDigit(normalizedSource[i + 1]))) {
      const start = i;
      i += 1;
      while (i < normalizedSource.length && (isDigit(normalizedSource[i]) || normalizedSource[i] === '.')) {
        i += 1;
      }
      tokens.push({ type: 'number', value: normalizedSource.slice(start, i), at: start });
      continue;
    }

    if (isAlpha(ch)) {
      const start = i;
      i += 1;
      while (i < normalizedSource.length && isAlphaNumeric(normalizedSource[i])) {
        i += 1;
      }
      tokens.push({ type: 'identifier', value: normalizedSource.slice(start, i), at: start });
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '⊗') {
      tokens.push({ type: 'operator', value: ch, at: i });
      i += 1;
      continue;
    }

    if (ch === '(' || ch === '[') {
      tokens.push({ type: 'lparen', value: ch, at: i });
      i += 1;
      continue;
    }

    if (ch === ')' || ch === ']') {
      tokens.push({ type: 'rparen', value: ch, at: i });
      i += 1;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'comma', value: ch, at: i });
      i += 1;
      continue;
    }

    if (ch === '=') {
      i += 1;
      continue;
    }

    return fail({
      code: 'TOKEN_INVALID',
      message: `Invalid token '${ch}' at position ${i}`,
      at: i,
    });
  }

  tokens.push({ type: 'eof', value: '', at: normalizedSource.length });
  return ok(tokens);
}
