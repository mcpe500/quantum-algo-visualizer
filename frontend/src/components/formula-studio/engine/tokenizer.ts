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

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isAlpha(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
}

function isAlphaNumeric(ch: string): boolean {
  return isAlpha(ch) || isDigit(ch);
}

export function tokenizeExpression(source: string): EngineResult<Token[]> {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const ch = source[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i += 1;
      continue;
    }

    if (isDigit(ch) || (ch === '.' && i + 1 < source.length && isDigit(source[i + 1]))) {
      const start = i;
      i += 1;
      while (i < source.length && (isDigit(source[i]) || source[i] === '.')) {
        i += 1;
      }
      tokens.push({ type: 'number', value: source.slice(start, i), at: start });
      continue;
    }

    if (isAlpha(ch)) {
      const start = i;
      i += 1;
      while (i < source.length && isAlphaNumeric(source[i])) {
        i += 1;
      }
      tokens.push({ type: 'identifier', value: source.slice(start, i), at: start });
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^') {
      tokens.push({ type: 'operator', value: ch, at: i });
      i += 1;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'lparen', value: ch, at: i });
      i += 1;
      continue;
    }

    if (ch === ')') {
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

  tokens.push({ type: 'eof', value: '', at: source.length });
  return ok(tokens);
}
