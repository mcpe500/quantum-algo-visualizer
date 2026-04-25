import type { EngineResult, ExprNode } from './types';
import { fail, ok } from './errors';
import { tokenizeExpression, type Token } from './tokenizer';

class Parser {
  private index = 0;
  private readonly tokens: Token[];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1];
  }

  private consume(): Token {
    const token = this.current();
    this.index += 1;
    return token;
  }

  private match(type: Token['type'], value?: string): boolean {
    const token = this.current();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  parseExpression(): EngineResult<ExprNode> {
    if (this.match('eof')) {
      return fail({ code: 'PARSE_EMPTY', message: 'Expression is empty' });
    }

    const exprResult = this.parseAdditive();
    if (!exprResult.ok) return exprResult;

    const tail = this.current();
    if (tail.type !== 'eof') {
      return fail({
        code: 'PARSE_UNEXPECTED_TOKEN',
        message: `Unexpected token '${tail.value}' at position ${tail.at}`,
        at: tail.at,
      });
    }

    return exprResult;
  }

  private parseAdditive(): EngineResult<ExprNode> {
    const first = this.parseMultiplicative();
    if (!first.ok) return first;
    let left = first.value;

    while (this.match('operator', '+') || this.match('operator', '-')) {
      const operator = this.consume().value as '+' | '-';
      const rightResult = this.parseMultiplicative();
      if (!rightResult.ok) return rightResult;
      left = {
        kind: 'BinaryExpression',
        operator,
        left,
        right: rightResult.value,
      };
    }

    return ok(left);
  }

  private parseMultiplicative(): EngineResult<ExprNode> {
    const first = this.parsePower();
    if (!first.ok) return first;
    let left = first.value;

    while (this.match('operator', '*') || this.match('operator', '/')) {
      const operator = this.consume().value as '*' | '/';
      const rightResult = this.parsePower();
      if (!rightResult.ok) return rightResult;
      left = {
        kind: 'BinaryExpression',
        operator,
        left,
        right: rightResult.value,
      };
    }

    return ok(left);
  }

  private parsePower(): EngineResult<ExprNode> {
    const leftResult = this.parseUnary();
    if (!leftResult.ok) return leftResult;

    if (this.match('operator', '^')) {
      this.consume();
      const rightResult = this.parsePower();
      if (!rightResult.ok) return rightResult;
      return ok({
        kind: 'BinaryExpression',
        operator: '^',
        left: leftResult.value,
        right: rightResult.value,
      });
    }

    return leftResult;
  }

  private parseUnary(): EngineResult<ExprNode> {
    if (this.match('operator', '-')) {
      this.consume();
      const argResult = this.parseUnary();
      if (!argResult.ok) return argResult;
      return ok({ kind: 'UnaryExpression', operator: '-', argument: argResult.value });
    }
    return this.parsePrimary();
  }

  private parsePrimary(): EngineResult<ExprNode> {
    if (this.match('number')) {
      const token = this.consume();
      const value = Number(token.value);
      if (!Number.isFinite(value)) {
        return fail({
          code: 'PARSE_UNEXPECTED_TOKEN',
          message: `Invalid number '${token.value}'`,
          at: token.at,
        });
      }
      return ok({ kind: 'NumberLiteral', value });
    }

    if (this.match('identifier')) {
      const token = this.consume();
      if (this.match('lparen')) {
        this.consume();
        const args: ExprNode[] = [];
        if (!this.match('rparen')) {
          while (true) {
            const argResult = this.parseAdditive();
            if (!argResult.ok) return argResult;
            args.push(argResult.value);
            if (this.match('comma')) {
              this.consume();
              continue;
            }
            break;
          }
        }

        if (!this.match('rparen')) {
          const current = this.current();
          return fail({
            code: 'PARSE_UNBALANCED_PAREN',
            message: `Expected ')' at position ${current.at}`,
            at: current.at,
          });
        }
        this.consume();
        return ok({ kind: 'FunctionCall', name: token.value, args });
      }
      return ok({ kind: 'Symbol', name: token.value });
    }

    if (this.match('lparen')) {
      const start = this.consume();
      const exprResult = this.parseAdditive();
      if (!exprResult.ok) return exprResult;
      if (!this.match('rparen')) {
        const current = this.current();
        return fail({
          code: 'PARSE_UNBALANCED_PAREN',
          message: `Unclosed '(' at position ${start.at}; expected ')' before ${current.at}`,
          at: current.at,
        });
      }
      this.consume();
      return exprResult;
    }

    const token = this.current();
    return fail({
      code: 'PARSE_UNEXPECTED_TOKEN',
      message: `Unexpected token '${token.value}' at position ${token.at}`,
      at: token.at,
    });
  }
}

export function parseExpression(source: string): EngineResult<ExprNode> {
  try {
    const tokensResult = tokenizeExpression(source);
    if (!tokensResult.ok) return tokensResult;
    const parser = new Parser(tokensResult.value);
    return parser.parseExpression();
  } catch (err) {
    return fail({
      code: 'PARSE_FAILED',
      message: err instanceof Error ? err.message : `Parse error at position 0`,
      at: 0,
    });
  }
}
