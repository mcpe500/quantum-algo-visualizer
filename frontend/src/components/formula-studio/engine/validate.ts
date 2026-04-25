import type { EngineResult, ExprNode } from './types';
import { fail } from './errors';
import { parseExpression } from './parser';

export function stripEquality(source: string): string {
  const eqIndex = source.indexOf('=');
  if (eqIndex > 0) {
    return source.slice(0, eqIndex).trim();
  }
  return source;
}

export function stripLatexNoise(source: string): string {
  let result = source;

  result = result.replace(/\\text\{[^}]*\}/gi, '');
  result = result.replace(/\\mathbb\{[^}]*\}/gi, '');
  result = result.replace(/\\begin\{[^}]*\}/gi, '');
  result = result.replace(/\\end\{[^}]*\}/gi, '');
  result = result.replace(/\\[a-zA-Z]+/g, (match) => {
    const cmd = match.slice(1).toLowerCase();
    if (['sqrt', 'sin', 'cos', 'tan', 'exp', 'ln', 'log', 'min', 'max', 'abs', 'pow'].includes(cmd)) {
      return match;
    }
    return '';
  });

  result = result.replace(/\\rangle/gi, '');
  result = result.replace(/\\langle/gi, '');
  result = result.replace(/\\otimes/gi, '');
  result = result.replace(/\\oplus/gi, '');
  result = result.replace(/\\oplus/gi, '');
  result = result.replace(/\|/g, ' ');
  result = result.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');
  result = result.replace(/\\sqrt\{([^}]*)\}/g, 'sqrt($1)');
  result = result.replace(/_\{([^}]*)\}/g, '_$1');
  result = result.replace(/\^\{([^}]*)\}/g, '^$1');
  result = result.replace(/_\[([^\]]*)\]/g, '_$1');
  result = result.replace(/\^\[([^\]]*)\]/g, '^$1');
  result = result.replace(/[{}]/g, '');
  result = result.replace(/\\/g, '');
  result = result.replace(/\$/g, '');
  result = result.replace(/\\+/g, '');
  result = result.replace(/\s+/g, ' ').trim();

  const eqIdx = result.indexOf('=');
  if (eqIdx > 0) {
    result = result.slice(0, eqIdx);
  }

  return result;
}

export function canCompute(source: string): boolean {
  const stripped = stripLatexNoise(source);
  if (!stripped.trim()) return false;
  if (/^[0-9+\-*/^().,\s]+$/i.test(stripped)) return true;
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/i.test(stripped)) return true;
  if (stripped.includes('(') && stripped.includes(')')) return true;
  try {
    const result = parseExpression(stripped);
    return result.ok;
  } catch {
    return false;
  }
}

export function safeParse(source: string): EngineResult<ExprNode> {
  const cleaned = stripLatexNoise(source);
  if (!cleaned.trim()) {
    return fail({ code: 'PARSE_EMPTY', message: 'Expression is empty after stripping LaTeX markup', at: 0 });
  }
  return parseExpression(cleaned);
}