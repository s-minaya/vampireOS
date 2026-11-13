// The typed-code puzzle. David's code is never executed by the browser:
// it is parsed and interpreted here, in a tiny dialect with no loops, no calls
// and no member access, so it cannot freeze or touch the page.

export const ORIGINAL_SOURCE = [
  'function canOpenGift(date) {',
  "  if (date !== '15.11') {",
  '    return false;',
  '  }',
  '  // copy-pasted from above. faster.',
  '  return false;',
  '}',
].join('\n');

const CASES = [
  { arg: '14.11', want: false },
  { arg: '15.11', want: true },
];

const MAX_LENGTH = 1500;
const MAX_DEPTH = 40;
const DIALECT = 'VampireOS only speaks a small dialect: if, else, return and comparisons.';

class PuzzleError extends Error {
  constructor(name, message) {
    super(message);
    this.name = name;
  }
}

function tokenize(src) {
  const tokens = [];
  const n = src.length;
  let i = 0;
  while (i < n) {
    const ch = src[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i += 1;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) throw new PuzzleError('SyntaxError', 'Unterminated comment');
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      let value = '';
      while (j < n && src[j] !== ch) {
        if (src[j] === '\n') throw new PuzzleError('SyntaxError', 'Unterminated string');
        if (src[j] === '\\') j += 1;
        value += src[j] ?? '';
        j += 1;
      }
      if (j >= n) throw new PuzzleError('SyntaxError', 'Unterminated string');
      tokens.push({ type: 'string', value });
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < n && /[0-9.]/.test(src[j])) j += 1;
      tokens.push({ type: 'number', value: Number(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j += 1;
      tokens.push({ type: 'word', value: src.slice(i, j) });
      i = j;
      continue;
    }
    const three = src.slice(i, i + 3);
    const two = src.slice(i, i + 2);
    if (three === '===' || three === '!==') { tokens.push({ type: 'op', value: three }); i += 3; continue; }
    if (two === '==' || two === '!=' || two === '&&' || two === '||') { tokens.push({ type: 'op', value: two }); i += 2; continue; }
    if ('(){};,!?:='.includes(ch)) { tokens.push({ type: 'op', value: ch }); i += 1; continue; }
    throw new PuzzleError('SyntaxError', `Unexpected "${ch}". ${DIALECT}`);
  }
  return tokens;
}

function parse(tokens) {
  let p = 0;
  let depth = 0;
  const peek = () => tokens[p];
  const isOp = (value) => peek() && peek().type === 'op' && peek().value === value;
  const isWord = (value) => peek() && peek().type === 'word' && peek().value === value;
  const describe = (t) => (t ? `"${t.value}"` : 'end of file');
  const expectOp = (value) => {
    if (!isOp(value)) throw new PuzzleError('SyntaxError', `Expected "${value}" but found ${describe(peek())}`);
    p += 1;
  };
  const enter = () => {
    depth += 1;
    if (depth > MAX_DEPTH) throw new PuzzleError('RangeError', 'That is nested deeper than any crypt. Simplify.');
  };
  const leave = () => { depth -= 1; };

  function primary() {
    const t = peek();
    if (!t) throw new PuzzleError('SyntaxError', 'Unexpected end of file');
    if (t.type === 'string' || t.type === 'number') { p += 1; return { k: 'lit', v: t.value }; }
    if (t.type === 'word') {
      p += 1;
      if (t.value === 'true') return { k: 'lit', v: true };
      if (t.value === 'false') return { k: 'lit', v: false };
      if (t.value === 'null') return { k: 'lit', v: null };
      if (t.value === 'undefined') return { k: 'lit', v: undefined };
      if (isOp('(')) throw new PuzzleError('TypeError', 'VampireOS cannot call functions. It can barely return values.');
      return { k: 'id', name: t.value };
    }
    if (isOp('(')) {
      p += 1;
      const e = expression();
      expectOp(')');
      return e;
    }
    throw new PuzzleError('SyntaxError', `Unexpected ${describe(t)}`);
  }

  function unary() {
    if (isOp('!')) {
      enter();
      p += 1;
      const e = { k: 'not', e: unary() };
      leave();
      return e;
    }
    return primary();
  }

  function equality() {
    let left = unary();
    while (peek() && peek().type === 'op' && ['===', '!==', '==', '!='].includes(peek().value)) {
      const op = peek().value;
      p += 1;
      left = { k: 'cmp', op, l: left, r: unary() };
    }
    return left;
  }

  function and() {
    let left = equality();
    while (isOp('&&')) { p += 1; left = { k: 'and', l: left, r: equality() }; }
    return left;
  }

  function or() {
    let left = and();
    while (isOp('||')) { p += 1; left = { k: 'or', l: left, r: and() }; }
    return left;
  }

  function expression() {
    enter();
    let e = or();
    if (isOp('?')) {
      p += 1;
      const yes = expression();
      expectOp(':');
      const no = expression();
      e = { k: 'tern', c: e, yes, no };
    }
    leave();
    return e;
  }

  function block() {
    expectOp('{');
    const body = [];
    while (peek() && !isOp('}')) body.push(statement());
    expectOp('}');
    return { k: 'block', body };
  }

  function statement() {
    enter();
    let s;
    const t = peek();
    if (isOp('{')) {
      s = block();
    } else if (isOp(';')) {
      p += 1;
      s = { k: 'block', body: [] };
    } else if (isWord('if')) {
      p += 1;
      expectOp('(');
      const c = expression();
      expectOp(')');
      const yes = statement();
      let no = null;
      if (isWord('else')) { p += 1; no = statement(); }
      s = { k: 'if', c, yes, no };
    } else if (isWord('return')) {
      p += 1;
      let e = null;
      if (peek() && !isOp(';') && !isOp('}')) e = expression();
      if (isOp(';')) p += 1;
      s = { k: 'return', e };
    } else if (isWord('const') || isWord('let') || isWord('var')) {
      p += 1;
      const name = peek();
      if (!name || name.type !== 'word') throw new PuzzleError('SyntaxError', 'Expected a variable name');
      p += 1;
      expectOp('=');
      const e = expression();
      if (isOp(';')) p += 1;
      s = { k: 'decl', name: name.value, e };
    } else if (t && t.type === 'word' && ['while', 'for', 'do'].includes(t.value)) {
      throw new PuzzleError('LoopError', 'VampireOS does not permit loops on birthdays.');
    } else {
      throw new PuzzleError('SyntaxError', `Unexpected ${describe(t)}. ${DIALECT}`);
    }
    leave();
    return s;
  }

  if (!isWord('function')) throw new PuzzleError('SyntaxError', `Expected "function" but found ${describe(peek())}`);
  p += 1;
  const name = peek();
  if (!name || name.type !== 'word') throw new PuzzleError('SyntaxError', 'Expected a function name');
  p += 1;
  expectOp('(');
  const params = [];
  while (peek() && !isOp(')')) {
    const param = peek();
    if (param.type !== 'word') throw new PuzzleError('SyntaxError', `Unexpected ${describe(param)} in parameters`);
    params.push(param.value);
    p += 1;
    if (isOp(',')) p += 1;
  }
  expectOp(')');
  const body = block();
  if (peek()) throw new PuzzleError('SyntaxError', `Unexpected ${describe(peek())} after the function`);
  return { name: name.value, params, body };
}

function evaluate(node, env) {
  switch (node.k) {
    case 'lit': return node.v;
    case 'id':
      if (!env.has(node.name)) throw new PuzzleError('ReferenceError', `${node.name} is not defined`);
      return env.get(node.name);
    case 'not': return !evaluate(node.e, env);
    case 'and': return evaluate(node.l, env) && evaluate(node.r, env);
    case 'or': return evaluate(node.l, env) || evaluate(node.r, env);
    case 'tern': return evaluate(node.c, env) ? evaluate(node.yes, env) : evaluate(node.no, env);
    case 'cmp': {
      const l = evaluate(node.l, env);
      const r = evaluate(node.r, env);
      if (node.op === '===') return l === r;
      if (node.op === '!==') return l !== r;
      // eslint-disable-next-line eqeqeq
      if (node.op === '==') return l == r;
      // eslint-disable-next-line eqeqeq
      return l != r;
    }
    default: throw new PuzzleError('Error', 'Unknown expression');
  }
}

// Returns { done: true, value } once a return statement has run.
function execute(node, env) {
  switch (node.k) {
    case 'block':
      for (const s of node.body) {
        const r = execute(s, env);
        if (r.done) return r;
      }
      return { done: false };
    case 'if':
      if (evaluate(node.c, env)) return execute(node.yes, env);
      return node.no ? execute(node.no, env) : { done: false };
    case 'return':
      return { done: true, value: node.e ? evaluate(node.e, env) : undefined };
    case 'decl':
      env.set(node.name, evaluate(node.e, env));
      return { done: false };
    default: throw new PuzzleError('Error', 'Unknown statement');
  }
}

const show = (value) => (typeof value === 'string' ? `'${value}'` : String(value));

/**
 * Runs the two checks against the typed source.
 * @returns {{ error: string } | { results: Array<{arg: string, want: boolean, shown: string, ok: boolean}> }}
 */
export function runChecks(source) {
  try {
    if (source.length > MAX_LENGTH) {
      throw new PuzzleError('RangeError', 'This file has grown longer than the bug deserves.');
    }
    const normalised = source.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    const fn = parse(tokenize(normalised));
    if (fn.name !== 'canOpenGift') throw new PuzzleError('ReferenceError', 'canOpenGift is not defined');
    const results = CASES.map((c) => {
      const env = new Map();
      if (fn.params.length > 0) env.set(fn.params[0], c.arg);
      const out = execute(fn.body, env);
      const got = out.done ? out.value : undefined;
      return { arg: c.arg, want: c.want, shown: show(got), ok: got === c.want };
    });
    return { results };
  } catch (e) {
    return { error: `${e.name || 'Error'}: ${e.message}` };
  }
}
