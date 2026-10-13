/**
 * Convierte el AST del programa en bloques estructurados para dibujar
 * diagramas de flujo y diagramas de Nassi-Shneiderman, incluyendo comentarios
 * y anotaciones presentes en el código fuente.
 */
import * as acorn from 'acorn';

type N = any;

export type OpShape = 'process' | 'input' | 'output' | 'call' | 'return' | 'terminal' | 'jump' | 'comment';

export type FBlock =
  | { k: 'seq'; items: FBlock[] }
  | { k: 'op'; shape: OpShape; text: string; line: number }
  | { k: 'if'; cond: string; line: number; yes: FBlock; no: FBlock | null }
  | { k: 'while'; cond: string; line: number; body: FBlock }
  | { k: 'dowhile'; cond: string; line: number; body: FBlock }
  | { k: 'for'; init: string; cond: string; update: string; line: number; body: FBlock }
  | { k: 'forof'; variable: string; iterable: string; of: boolean; line: number; body: FBlock }
  | { k: 'switch'; expr: string; line: number; cases: { label: string; line: number; body: FBlock }[] }
  | { k: 'try'; line: number; body: FBlock; param: string | null; handler: FBlock | null; finalizer: FBlock | null };

export interface FlowDiagram {
  id: string;
  name: string;
  kind: 'main' | 'function' | 'method';
  line: number;
  body: FBlock;
}

export interface BuildFlowOptions {
  showComments?: boolean;
}

const OUTPUT_FNS = new Set(['console.log', 'console.info', 'console.warn', 'console.error', 'console.table', 'alert']);

export function buildFlow(code: string, options: BuildFlowOptions = {}): FlowDiagram[] {
  const showComments = options.showComments ?? true;
  const comments: acorn.Comment[] = [];
  const ast: N = acorn.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    locations: true,
    onComment: comments,
  });

  const src = (n: N) => code.slice(n.start, n.end).replace(/\s+/g, ' ').replace(/;$/, '').trim();
  const diagrams: FlowDiagram[] = [];
  const functions: { name: string; node: N; kind: 'function' | 'method' }[] = [];

  const hasInput = (n: N): boolean => {
    let found = false;
    const walk = (x: N) => {
      if (found || !x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (/Function/.test(x.type)) return;
      if (x.type === 'CallExpression' && x.callee.type === 'Identifier' && (x.callee.name === 'prompt' || x.callee.name === 'confirm')) {
        found = true;
        return;
      }
      for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') walk(x[k]);
    };
    walk(n);
    return found;
  };

  /** Registra funciones anidadas para dibujarlas en diagramas propios. */
  const collectFunctions = (n: N, prefix = '') => {
    const walk = (x: N, owner: string) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach((y) => walk(y, owner));
      if (x.type === 'FunctionDeclaration') {
        functions.push({ name: x.id.name, node: x, kind: 'function' });
        walk(x.body, x.id.name);
        return;
      }
      if (x.type === 'VariableDeclarator' && x.init && /FunctionExpression|ArrowFunctionExpression/.test(x.init.type) && x.id.type === 'Identifier') {
        functions.push({ name: x.id.name, node: x.init, kind: 'function' });
        walk(x.init.body, x.id.name);
        return;
      }
      if (x.type === 'ClassDeclaration' || x.type === 'ClassExpression') {
        const cname = x.id?.name ?? 'Clase';
        for (const m of x.body.body) {
          if (m.type === 'MethodDefinition') {
            const mname = m.kind === 'constructor' ? 'constructor' : m.key.name ?? src(m.key);
            functions.push({ name: `${cname}.${m.kind === 'get' ? 'get ' : m.kind === 'set' ? 'set ' : ''}${mname}`, node: m.value, kind: 'method' });
            walk(m.value.body, cname);
          }
        }
        return;
      }
      for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') walk(x[k], owner);
    };
    walk(n, prefix);
  };

  const op = (shape: OpShape, text: string, n: N): FBlock => ({ k: 'op', shape, text, line: n.loc.start.line });

  const exprBlock = (e: N, n: N): FBlock => {
    if (e.type === 'CallExpression') {
      const callee = src(e.callee);
      if (OUTPUT_FNS.has(callee)) return op('output', e.arguments.map(src).join(', ') || '(línea vacía)', n);
      if (hasInput(e)) return op('input', src(e), n);
      return op('call', src(e), n);
    }
    if (hasInput(e)) return op('input', src(e), n);
    return op('process', src(e), n);
  };

  const formatComment = (c: acorn.Comment): string => {
    if (c.type === 'Line') {
      return `// ${c.value.trim()}`;
    }
    const lines = c.value
      .split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, '').trim())
      .filter((l) => l.length > 0);
    return lines.length ? lines.map((l) => `/* ${l} */`).join('\n') : '/* */';
  };

  const getCommentsForRange = (stmts: N[], startRange: number, endRange: number): acorn.Comment[] => {
    if (!showComments || !comments.length) return [];
    return comments.filter((c) => {
      if (c.start < startRange || c.end > endRange) return false;
      for (const s of stmts) {
        if (c.start >= s.start && c.end <= s.end) return false;
      }
      return true;
    });
  };

  const seq = (stmts: N[], startRange?: number, endRange?: number): FBlock => {
    if (!showComments || startRange === undefined || endRange === undefined) {
      return { k: 'seq', items: stmts.map(block).filter((b): b is FBlock => b !== null) };
    }

    const localComments = getCommentsForRange(stmts, startRange, endRange);
    const entities: ({ kind: 'stmt'; node: N; start: number } | { kind: 'comment'; node: acorn.Comment; start: number })[] = [];

    for (const s of stmts) {
      entities.push({ kind: 'stmt', node: s, start: s.start });
    }
    for (const c of localComments) {
      entities.push({ kind: 'comment', node: c, start: c.start });
    }
    entities.sort((a, b) => a.start - b.start);

    const items: FBlock[] = [];
    let pendingComment: { text: string; line: number; lastLine: number } | null = null;

    const flushComment = () => {
      if (pendingComment) {
        items.push({
          k: 'op',
          shape: 'comment',
          text: pendingComment.text,
          line: pendingComment.line,
        });
        pendingComment = null;
      }
    };

    for (const ent of entities) {
      if (ent.kind === 'comment') {
        const c = ent.node;
        const formatted = formatComment(c);
        const cLine = c.loc?.start.line ?? 0;
        const cEndLine = c.loc?.end.line ?? cLine;
        if (pendingComment && c.type === 'Line' && pendingComment.lastLine + 1 === cLine) {
          pendingComment.text += '\n' + formatted;
          pendingComment.lastLine = cEndLine;
        } else {
          flushComment();
          pendingComment = {
            text: formatted,
            line: cLine,
            lastLine: cEndLine,
          };
        }
      } else {
        flushComment();
        const b = block(ent.node);
        if (b !== null) {
          items.push(b);
        }
      }
    }
    flushComment();

    return { k: 'seq', items };
  };

  const block = (n: N): FBlock | null => {
    switch (n.type) {
      case 'BlockStatement':
        return seq(n.body, n.start, n.end);
      case 'ExpressionStatement':
        return exprBlock(n.expression, n);
      case 'VariableDeclaration': {
        const parts = n.declarations
          .filter((d: N) => !(d.init && /FunctionExpression|ArrowFunctionExpression/.test(d.init.type)))
          .map((d: N) => (d.init ? `${src(d.id)} = ${src(d.init)}` : src(d.id)));
        if (!parts.length) return null;
        const text = `${n.kind} ${parts.join(', ')}`;
        return op(hasInput(n) ? 'input' : 'process', text, n);
      }
      case 'ReturnStatement':
        return op('return', n.argument ? `return ${src(n.argument)}` : 'return', n);
      case 'BreakStatement':
        return op('jump', n.label ? `break ${n.label.name}` : 'break', n);
      case 'ContinueStatement':
        return op('jump', n.label ? `continue ${n.label.name}` : 'continue', n);
      case 'ThrowStatement':
        return op('jump', `throw ${src(n.argument)}`, n);
      case 'IfStatement': {
        const yesBlock = n.consequent.type === 'BlockStatement' ? block(n.consequent) : seq([n.consequent], n.test.end, n.consequent.end);
        let noBlock: FBlock | null = null;
        if (n.alternate) {
          if (n.alternate.type === 'BlockStatement' || n.alternate.type === 'IfStatement') {
            noBlock = block(n.alternate);
          } else {
            noBlock = seq([n.alternate], n.consequent.end, n.alternate.end);
          }
        }
        return { k: 'if', cond: src(n.test), line: n.loc.start.line, yes: yesBlock ?? seq([]), no: noBlock };
      }
      case 'WhileStatement': {
        const body = n.body.type === 'BlockStatement' ? block(n.body) : seq([n.body], n.test.end, n.body.end);
        return { k: 'while', cond: src(n.test), line: n.loc.start.line, body: body ?? seq([]) };
      }
      case 'DoWhileStatement': {
        const body = n.body.type === 'BlockStatement' ? block(n.body) : seq([n.body], n.start, n.body.end);
        return { k: 'dowhile', cond: src(n.test), line: n.test.loc.start.line, body: body ?? seq([]) };
      }
      case 'ForStatement': {
        const body = n.body.type === 'BlockStatement' ? block(n.body) : seq([n.body], n.start, n.body.end);
        return {
          k: 'for',
          init: n.init ? src(n.init) : '',
          cond: n.test ? src(n.test) : 'true',
          update: n.update ? src(n.update) : '',
          line: n.loc.start.line,
          body: body ?? seq([]),
        };
      }
      case 'ForOfStatement':
      case 'ForInStatement': {
        const left = n.left.type === 'VariableDeclaration' ? src(n.left.declarations[0].id) : src(n.left);
        const body = n.body.type === 'BlockStatement' ? block(n.body) : seq([n.body], n.start, n.body.end);
        return { k: 'forof', variable: left, iterable: src(n.right), of: n.type === 'ForOfStatement', line: n.loc.start.line, body: body ?? seq([]) };
      }
      case 'SwitchStatement':
        return {
          k: 'switch',
          expr: src(n.discriminant),
          line: n.loc.start.line,
          cases: n.cases.map((c: N) => ({
            label: c.test ? src(c.test) : 'default',
            line: c.loc.start.line,
            body: seq(c.consequent.filter((s: N) => !(s.type === 'BreakStatement' && !s.label)), c.start, c.end),
          })),
        };
      case 'TryStatement':
        return {
          k: 'try',
          line: n.loc.start.line,
          body: block(n.block) ?? seq([]),
          param: n.handler?.param ? src(n.handler.param) : null,
          handler: n.handler ? block(n.handler.body) : null,
          finalizer: n.finalizer ? block(n.finalizer) : null,
        };
      case 'LabeledStatement':
        return block(n.body);
      case 'ClassDeclaration':
        return op('process', `class ${n.id.name}${n.superClass ? ` extends ${src(n.superClass)}` : ''}`, n);
      case 'FunctionDeclaration':
      case 'EmptyStatement':
        return null;
      case 'DebuggerStatement':
        return op('jump', 'debugger', n);
    }
    return op('process', src(n), n);
  };

  collectFunctions(ast);

  diagrams.push({
    id: 'main',
    name: 'Programa principal',
    kind: 'main',
    line: 1,
    body: {
      k: 'seq',
      items: [
        { k: 'op', shape: 'terminal', text: 'Inicio', line: 0 },
        seq(ast.body, 0, code.length),
        { k: 'op', shape: 'terminal', text: 'Fin', line: 0 },
      ],
    },
  });

  for (const f of functions) {
    const n = f.node;
    const params = n.params.map(src).join(', ');
    const body: FBlock = n.body.type === 'BlockStatement' ? seq(n.body.body, n.body.start, n.body.end) : op('return', `return ${src(n.body)}`, n.body);

    const leadingBlocks: FBlock[] = [];
    if (showComments) {
      const leading = comments.filter((c) => {
        if (c.end > n.start) return false;
        const gap = code.slice(c.end, n.start);
        return gap.trim() === '';
      });
      if (leading.length) {
        const text = leading.map(formatComment).join('\n');
        leadingBlocks.push({
          k: 'op',
          shape: 'comment',
          text,
          line: leading[0]?.loc?.start.line ?? n.loc.start.line,
        });
      }
    }

    diagrams.push({
      id: `${f.name}@${n.start}`,
      name: f.name,
      kind: f.kind,
      line: n.loc.start.line,
      body: {
        k: 'seq',
        items: [
          { k: 'op', shape: 'terminal', text: `${f.name}(${params})`, line: n.loc.start.line },
          ...leadingBlocks,
          body,
          { k: 'op', shape: 'terminal', text: `Fin ${f.name}`, line: 0 },
        ],
      },
    });
  }
  return diagrams;
}
