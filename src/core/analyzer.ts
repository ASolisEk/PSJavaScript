/**
 * Analizador estático: detecta errores de sintaxis, variables no declaradas,
 * malas prácticas y reglas del perfil mientras se escribe.
 */
import * as acorn from 'acorn';
import { ErrorHint, hintFor } from './errors';
import { explainSyntaxError } from './syntaxHelp';
import { closest } from './text';
import type { Profile } from './profiles';

type N = any;

export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  line: number;
  col: number;
  endLine: number;
  endCol: number;
  severity: Severity;
  message: string;
  rule: string;
  hint?: ErrorHint;
  /** Título corto (errores de sintaxis explicados). */
  title?: string;
  /** Línea donde se detectó, si el problema real está en otra. */
  detectedLine?: number;
}

/** Reglas cuyos errores impiden ejecutar (como en PSeInt). */
export const BLOCKING_RULES = new Set(['syntax', 'forbid-var', 'basic-only', 'unsupported']);

export const BUILTIN_NAMES = new Set([
  'console', 'Math', 'prompt', 'confirm', 'alert', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
  'Number', 'String', 'Boolean', 'Array', 'Object', 'Map', 'Set', 'WeakMap', 'WeakSet', 'Date', 'RegExp', 'JSON', 'Symbol',
  'Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
  'encodeURIComponent', 'decodeURIComponent', 'encodeURI', 'decodeURI', 'BigInt', 'Intl', 'structuredClone',
  'Infinity', 'NaN', 'undefined', 'arguments',
]);

const UNAVAILABLE: Record<string, string> = {
  document: 'document (DOM) no está disponible: este entorno no tiene una página web',
  window: 'window no está disponible: este entorno no es un navegador',
  require: 'require() no está disponible: no se pueden importar módulos',
  process: 'process no está disponible (es de Node.js)',
  fetch: 'fetch() no está disponible: el intérprete no accede a la red',
  localStorage: 'localStorage no está disponible',
  globalThis: 'globalThis no está disponible',
  Promise: 'Las promesas no están soportadas por el intérprete',
};

const KNOWN_MEMBERS: Record<string, any> = { console: console, Math, JSON, Number, String, Object, Array, Date };

interface ADecl {
  name: string;
  kind: string;
  start: number;
  node: N;
  reads: number;
  writes: number;
  hasInit: boolean;
  scope: AScope;
}

class AScope {
  decls = new Map<string, ADecl>();
  constructor(public parent: AScope | null, public fn: N | null) {}
}

function loc(node: N) {
  return { line: node.loc.start.line, col: node.loc.start.column, endLine: node.loc.end.line, endCol: node.loc.end.column };
}

function patternIds(p: N, out: N[] = []): N[] {
  if (!p) return out;
  switch (p.type) {
    case 'Identifier':
      out.push(p);
      break;
    case 'AssignmentPattern':
      patternIds(p.left, out);
      break;
    case 'RestElement':
      patternIds(p.argument, out);
      break;
    case 'ObjectPattern':
      for (const q of p.properties) patternIds(q.type === 'RestElement' ? q.argument : q.value, out);
      break;
    case 'ArrayPattern':
      for (const e of p.elements) patternIds(e, out);
      break;
  }
  return out;
}

export function analyze(code: string, profile: Profile): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const push = (node: N, severity: Severity, message: string, rule: string, hint?: ErrorHint) =>
    diags.push({ ...loc(node), severity, message, rule, hint });

  let ast: N;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script', locations: true });
  } catch (e: any) {
    const x = explainSyntaxError(code, e);
    diags.push({ line: x.line, col: x.col, endLine: x.line, endCol: x.col + 1, severity: 'error', message: x.message, title: x.title, detectedLine: x.detectedLine, rule: 'syntax', hint: x.hint });
    return diags;
  }

  const allScopes: AScope[] = [];
  const unresolved: { node: N; write: boolean; read: boolean; typeofCheck: boolean }[] = [];
  const newScope = (parent: AScope | null, fn: N | null) => {
    const s = new AScope(parent, fn);
    allScopes.push(s);
    return s;
  };

  const declare = (scope: AScope, id: N, kind: string, hasInit: boolean, declNode: N) => {
    if (scope.decls.has(id.name) && kind !== 'var' && kind !== 'function') return;
    if (scope.decls.has(id.name)) return;
    scope.decls.set(id.name, { name: id.name, kind, start: declNode.start, node: id, reads: 0, writes: 0, hasInit, scope });
  };

  const hoistVars = (nodes: N[], scope: AScope) => {
    const visit = (n: N) => {
      if (!n) return;
      switch (n.type) {
        case 'VariableDeclaration':
          if (n.kind === 'var') for (const d of n.declarations) for (const id of patternIds(d.id)) declare(scope, id, 'var', !!d.init, n);
          break;
        case 'IfStatement':
          visit(n.consequent);
          visit(n.alternate);
          break;
        case 'ForStatement':
          visit(n.init);
          visit(n.body);
          break;
        case 'ForInStatement':
        case 'ForOfStatement':
          visit(n.left);
          visit(n.body);
          break;
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'LabeledStatement':
          visit(n.body);
          break;
        case 'BlockStatement':
          n.body.forEach(visit);
          break;
        case 'TryStatement':
          visit(n.block);
          if (n.handler) visit(n.handler.body);
          visit(n.finalizer);
          break;
        case 'SwitchStatement':
          for (const c of n.cases) c.consequent.forEach(visit);
          break;
      }
    };
    nodes.forEach(visit);
  };

  const hoistLexical = (stmts: N[], scope: AScope) => {
    for (const s of stmts) {
      if (s.type === 'VariableDeclaration' && s.kind !== 'var') {
        for (const d of s.declarations) for (const id of patternIds(d.id)) declare(scope, id, s.kind, !!d.init, s);
      } else if (s.type === 'ClassDeclaration') declare(scope, s.id, 'class', true, s);
      else if (s.type === 'FunctionDeclaration') declare(scope, s.id, 'function', true, { start: -1 });
    }
  };

  const fnOf = (scope: AScope): N | null => {
    let s: AScope | null = scope;
    while (s) {
      if (s.fn) return s.fn;
      s = s.parent;
    }
    return null;
  };

  const resolve = (id: N, scope: AScope, read: boolean, write: boolean, typeofCheck = false) => {
    let s: AScope | null = scope;
    while (s) {
      const d = s.decls.get(id.name);
      if (d) {
        if (read) d.reads++;
        if (write) {
          d.writes++;
          if (d.kind === 'const') push(id, 'error', `No se puede reasignar la constante '${id.name}'`, 'const-assign', hintFor('const-assign'));
        }
        if ((d.kind === 'let' || d.kind === 'const' || d.kind === 'class') && id.start < d.start && fnOf(scope) === fnOf(d.scope) && !typeofCheck) {
          push(id, 'error', `'${id.name}' se usa antes de ser declarada`, 'tdz', hintFor('tdz'));
        }
        return;
      }
      s = s.parent;
    }
    if (BUILTIN_NAMES.has(id.name)) {
      if (write && id.name !== 'arguments') push(id, 'error', `'${id.name}' es predefinida y no se puede reasignar`, 'const-assign');
      return;
    }
    unresolved.push({ node: id, write, read, typeofCheck });
  };

  const visitPatternDecl = (p: N, scope: AScope) => {
    // Visita valores por defecto y claves calculadas dentro de un patrón de declaración.
    if (!p) return;
    switch (p.type) {
      case 'AssignmentPattern':
        visitPatternDecl(p.left, scope);
        visit(p.right, scope);
        break;
      case 'RestElement':
        visitPatternDecl(p.argument, scope);
        break;
      case 'ObjectPattern':
        for (const q of p.properties) {
          if (q.type === 'RestElement') visitPatternDecl(q.argument, scope);
          else {
            if (q.computed) visit(q.key, scope);
            visitPatternDecl(q.value, scope);
          }
        }
        break;
      case 'ArrayPattern':
        p.elements.forEach((e: N) => visitPatternDecl(e, scope));
        break;
    }
  };

  const visitPatternTarget = (p: N, scope: AScope) => {
    // Patrón en el lado izquierdo de una asignación (escritura).
    if (!p) return;
    switch (p.type) {
      case 'Identifier':
        resolve(p, scope, false, true);
        break;
      case 'MemberExpression':
        visit(p, scope);
        break;
      case 'AssignmentPattern':
        visitPatternTarget(p.left, scope);
        visit(p.right, scope);
        break;
      case 'RestElement':
        visitPatternTarget(p.argument, scope);
        break;
      case 'ObjectPattern':
        for (const q of p.properties) {
          if (q.type === 'RestElement') visitPatternTarget(q.argument, scope);
          else {
            if (q.computed) visit(q.key, scope);
            visitPatternTarget(q.value, scope);
          }
        }
        break;
      case 'ArrayPattern':
        p.elements.forEach((e: N) => visitPatternTarget(e, scope));
        break;
    }
  };

  const visitFunction = (node: N, scope: AScope) => {
    let outer = scope;
    if (node.type === 'FunctionExpression' && node.id) {
      outer = newScope(scope, null);
      declare(outer, node.id, 'function', true, { start: -1 });
      outer.decls.get(node.id.name)!.reads++;
    }
    const fs = newScope(outer, node);
    for (const p of node.params) for (const id of patternIds(p)) declare(fs, id, 'param', true, { start: -1 });
    for (const p of node.params) visitPatternDecl(p, fs);
    if (node.body.type === 'BlockStatement') {
      hoistVars(node.body.body, fs);
      hoistLexical(node.body.body, fs);
      visitStatements(node.body.body, fs);
    } else visit(node.body, fs);
  };

  const visitClass = (node: N, scope: AScope) => {
    if (node.superClass) visit(node.superClass, scope);
    const cs = newScope(scope, null);
    if (node.id && node.type === 'ClassExpression') {
      declare(cs, node.id, 'class', true, { start: -1 });
      cs.decls.get(node.id.name)!.reads++;
    }
    for (const m of node.body.body) {
      if (m.computed) visit(m.key, cs);
      if (m.type === 'StaticBlock') {
        const bs = newScope(cs, m);
        hoistLexical(m.body, bs);
        visitStatements(m.body, bs);
      } else if (m.value) {
        if (m.type === 'PropertyDefinition') {
          const fs = newScope(cs, m);
          visit(m.value, fs);
        } else visit(m.value, cs);
      }
    }
  };

  const visitStatements = (stmts: N[], scope: AScope) => {
    let terminated: N | null = null;
    for (const s of stmts) {
      if (terminated && s.type !== 'FunctionDeclaration' && s.type !== 'EmptyStatement') {
        push(s, 'warning', `Código inalcanzable: nunca se ejecuta porque está después de '${terminated.type === 'ReturnStatement' ? 'return' : terminated.type === 'ThrowStatement' ? 'throw' : terminated.type === 'BreakStatement' ? 'break' : 'continue'}'`, 'unreachable');
        terminated = null;
      }
      visit(s, scope);
      if (['ReturnStatement', 'ThrowStatement', 'BreakStatement', 'ContinueStatement'].includes(s.type)) terminated = s;
    }
  };

  const hasExit = (body: N): boolean => {
    let found = false;
    const walk = (n: N, depth: number) => {
      if (!n || found || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach((x) => walk(x, depth));
      if (!n.type) return;
      if (/Function|Class/.test(n.type)) return;
      if (n.type === 'ReturnStatement' || n.type === 'ThrowStatement') {
        found = true;
        return;
      }
      if (n.type === 'BreakStatement' && (depth === 0 || n.label)) {
        found = true;
        return;
      }
      const isLoop = /^(For|ForIn|ForOf|While|DoWhile|Switch)Statement$/.test(n.type);
      for (const k of Object.keys(n)) if (k !== 'loc' && k !== 'type') walk(n[k], isLoop ? depth + 1 : depth);
    };
    walk(body, 0);
    return found;
  };

  const isConstTrue = (t: N) => t && ((t.type === 'Literal' && !!t.value) || (t.type === 'UnaryExpression' && t.operator === '!' && t.argument.type === 'Literal' && !t.argument.value));

  const checkBraces = (body: N, what: string) => {
    if (profile.requireBraces && body && body.type !== 'BlockStatement' && !(what === 'else' && body.type === 'IfStatement'))
      push(body, 'warning', `Usa llaves { } para el bloque del ${what}`, 'require-braces');
  };

  const checkEmptyBody = (body: N, what: string) => {
    if (body?.type === 'EmptyStatement') push(body, 'warning', `Punto y coma justo después del ${what}: el bloque queda vacío. ¿Sobra el ';'?`, 'empty-body');
  };

  const checkCondition = (test: N) => {
    if (test?.type === 'AssignmentExpression' && test.operator === '=')
      push(test, 'warning', `Asignación (=) dentro de una condición. ¿Quisiste comparar con ===?`, 'assign-in-condition');
  };

  const semicolonTypes = new Set(['ExpressionStatement', 'VariableDeclaration', 'ReturnStatement', 'BreakStatement', 'ContinueStatement', 'ThrowStatement', 'DoWhileStatement', 'DebuggerStatement']);
  const forHeads = new Set<N>();

  const basic = (node: N, what: string) => {
    if (profile.onlyBasicFeatures) push(node, 'error', `${what} no está permitido en el perfil '${profile.name}'`, 'basic-only');
  };

  function visit(node: N, scope: AScope): void {
    if (!node || typeof node !== 'object') return;
    if (profile.requireSemicolons && semicolonTypes.has(node.type) && !forHeads.has(node)) {
      if (code[node.end - 1] !== ';') {
        const end = node.loc.end;
        diags.push({ line: end.line, col: end.column, endLine: end.line, endCol: end.column + 1, severity: 'error', message: "Falta ';' al final de la instrucción", rule: 'semicolon', hint: hintFor('semicolon') });
      }
    }
    switch (node.type) {
      case 'Program':
        hoistVars(node.body, scope);
        hoistLexical(node.body, scope);
        visitStatements(node.body, scope);
        return;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        if (node.async) push(node, 'error', 'Las funciones async no están soportadas por el intérprete', 'unsupported', hintFor('unsupported'));
        if (node.generator) push(node, 'error', 'Las funciones generadoras (function*) no están soportadas', 'unsupported', hintFor('unsupported'));
        if (node.type === 'ArrowFunctionExpression') basic(node, 'Las funciones flecha (=>)');
        visitFunction(node, scope);
        return;
      case 'ClassDeclaration':
      case 'ClassExpression':
        basic(node, 'Las clases');
        visitClass(node, scope);
        return;
      case 'BlockStatement': {
        const bs = newScope(scope, null);
        hoistLexical(node.body, bs);
        visitStatements(node.body, bs);
        return;
      }
      case 'VariableDeclaration':
        if (node.kind === 'var' && profile.forbidVar) push(node, 'error', "No uses 'var': declara con let (si cambia) o const (si no cambia)", 'forbid-var');
        for (const d of node.declarations) {
          visitPatternDecl(d.id, scope);
          if (d.id.type !== 'Identifier') basic(d.id, 'La desestructuración');
          if (d.init) visit(d.init, scope);
          if (profile.requireCamelCase)
            for (const id of patternIds(d.id))
              if (!/^[a-z][a-zA-Z0-9]*$/.test(id.name) && !(node.kind === 'const' && /^[A-Z][A-Z0-9_]*$/.test(id.name)))
                push(id, 'info', `El nombre '${id.name}' no está en camelCase (ej. miVariable)`, 'camel-case');
        }
        return;
      case 'ForStatement': {
        const fs = newScope(scope, null);
        if (node.init) {
          if (node.init.type === 'VariableDeclaration') {
            forHeads.add(node.init);
            if (node.init.kind !== 'var') hoistLexical([node.init], fs);
          }
          visit(node.init, fs);
        }
        checkCondition(node.test);
        visit(node.test, fs);
        visit(node.update, fs);
        checkBraces(node.body, 'for');
        checkEmptyBody(node.body, 'for');
        if (!node.test && !hasExit(node.body)) push(node, 'warning', 'Ciclo for sin condición ni break: posible ciclo infinito', 'infinite-loop', hintFor('step-limit'));
        visit(node.body, fs);
        return;
      }
      case 'ForInStatement':
      case 'ForOfStatement': {
        const fs = newScope(scope, null);
        visit(node.right, scope);
        if (node.left.type === 'VariableDeclaration') {
          forHeads.add(node.left);
          if (node.left.kind === 'var' && profile.forbidVar) push(node.left, 'error', "No uses 'var': declara con let o const", 'forbid-var');
          if (node.left.kind !== 'var') hoistLexical([node.left], fs);
          for (const d of node.left.declarations) {
            visitPatternDecl(d.id, fs);
            for (const id of patternIds(d.id)) {
              const decl = fs.decls.get(id.name) ?? scope.decls.get(id.name);
              if (decl) decl.writes++;
            }
          }
        } else visitPatternTarget(node.left, fs);
        checkBraces(node.body, node.type === 'ForInStatement' ? 'for...in' : 'for...of');
        visit(node.body, fs);
        return;
      }
      case 'WhileStatement':
        checkCondition(node.test);
        if (isConstTrue(node.test) && !hasExit(node.body))
          push(node, 'warning', 'Ciclo while(true) sin break, return ni throw: es un ciclo infinito', 'infinite-loop', hintFor('step-limit'));
        visit(node.test, scope);
        checkBraces(node.body, 'while');
        checkEmptyBody(node.body, 'while');
        visit(node.body, scope);
        return;
      case 'DoWhileStatement':
        checkCondition(node.test);
        checkBraces(node.body, 'do...while');
        visit(node.body, scope);
        visit(node.test, scope);
        return;
      case 'IfStatement':
        checkCondition(node.test);
        visit(node.test, scope);
        checkBraces(node.consequent, 'if');
        checkEmptyBody(node.consequent, 'if');
        visit(node.consequent, scope);
        if (node.alternate) {
          checkBraces(node.alternate, 'else');
          visit(node.alternate, scope);
        }
        return;
      case 'SwitchStatement': {
        visit(node.discriminant, scope);
        const ss = newScope(scope, null);
        hoistLexical(node.cases.flatMap((c: N) => c.consequent), ss);
        for (const c of node.cases) {
          visit(c.test, ss);
          visitStatements(c.consequent, ss);
        }
        return;
      }
      case 'TryStatement':
        visit(node.block, scope);
        if (node.handler) {
          const cs = newScope(scope, null);
          if (node.handler.param) {
            for (const id of patternIds(node.handler.param)) {
              declare(cs, id, 'catch', true, { start: -1 });
              cs.decls.get(id.name)!.reads++;
            }
            visitPatternDecl(node.handler.param, cs);
          }
          visit(node.handler.body, cs);
        }
        visit(node.finalizer, scope);
        return;
      case 'LabeledStatement':
        basic(node, 'Las etiquetas');
        visit(node.body, scope);
        return;
      case 'BreakStatement':
      case 'ContinueStatement':
        return;
      case 'Identifier':
        resolve(node, scope, true, false);
        return;
      case 'AssignmentExpression':
        if (node.left.type === 'Identifier') resolve(node.left, scope, node.operator !== '=', true);
        else if (node.left.type === 'ObjectPattern' || node.left.type === 'ArrayPattern') {
          basic(node.left, 'La desestructuración');
          visitPatternTarget(node.left, scope);
        } else visit(node.left, scope);
        visit(node.right, scope);
        return;
      case 'UpdateExpression':
        if (node.argument.type === 'Identifier') resolve(node.argument, scope, true, true);
        else visit(node.argument, scope);
        return;
      case 'UnaryExpression':
        if (node.operator === 'typeof' && node.argument.type === 'Identifier') resolve(node.argument, scope, true, false, true);
        else visit(node.argument, scope);
        return;
      case 'BinaryExpression':
        if (profile.strictEquality && (node.operator === '==' || node.operator === '!=')) {
          push(node, 'warning', `Usa '${node.operator}=' en lugar de '${node.operator}' (comparación estricta, sin conversión de tipos)`, 'strict-equality');
        } else if (node.operator === '==' || node.operator === '!=') {
          const isNum = (x: N) => x.type === 'Literal' && typeof x.value === 'number';
          const isStr = (x: N) => x.type === 'Literal' && typeof x.value === 'string';
          const isBool = (x: N) => x.type === 'Literal' && typeof x.value === 'boolean';
          if ((isNum(node.left) && isStr(node.right)) || (isStr(node.left) && isNum(node.right)) ||
              (isBool(node.left) && (isNum(node.right) || isStr(node.right))) ||
              (isBool(node.right) && (isNum(node.left) || isStr(node.left)))) {
            push(node, 'info', `Comparación con conversión implícita: '${node.operator}' convierte tipos antes de evaluar. Usa '${node.operator}=' para evitar trampas de coerción`, 'coercion-trap');
          }
        }
        if (['==', '===', '!=', '!=='].includes(node.operator) && [node.left, node.right].some((x: N) => x.type === 'Identifier' && x.name === 'NaN'))
          push(node, 'warning', 'Comparar con NaN siempre da false. Usa Number.isNaN(x)', 'nan-compare');
        visit(node.left, scope);
        visit(node.right, scope);
        return;
      case 'MemberExpression': {
        visit(node.object, scope);
        if (node.computed) visit(node.property, scope);
        const obj = node.object;
        if (!node.computed && obj.type === 'Identifier' && KNOWN_MEMBERS[obj.name] && node.property.type === 'Identifier') {
          let shadowed = false;
          for (let s: AScope | null = scope; s; s = s.parent) if (s.decls.has(obj.name)) shadowed = true;
          const target = KNOWN_MEMBERS[obj.name];
          const prop = node.property.name;
          if (!shadowed && !(prop in target)) {
            const names = Object.getOwnPropertyNames(target);
            const sim = closest(prop, names);
            push(node.property, 'error', `${obj.name}.${prop} no existe${sim ? `. ¿Quisiste decir ${obj.name}.${sim}?` : ''}`, 'unknown-member', hintFor('not-function'));
          }
        }
        return;
      }
      case 'ChainExpression':
        basic(node, 'El encadenamiento opcional (?.)');
        visit(node.expression, scope);
        return;
      case 'SpreadElement':
      case 'RestElement':
        basic(node, 'El operador de propagación (...)');
        visit(node.argument, scope);
        return;
      case 'ObjectPattern':
      case 'ArrayPattern':
        visitPatternTarget(node, scope);
        return;
      case 'Property':
        if (node.computed) visit(node.key, scope);
        if (node.kind !== 'init') basic(node, 'Los getters/setters');
        visit(node.value, scope);
        return;
      case 'AwaitExpression':
      case 'YieldExpression':
        push(node, 'error', `${node.type === 'AwaitExpression' ? 'await' : 'yield'} no está soportado por el intérprete`, 'unsupported', hintFor('unsupported'));
        return;
      case 'TaggedTemplateExpression':
        push(node, 'error', 'Las plantillas etiquetadas no están soportadas', 'unsupported', hintFor('unsupported'));
        return;
      case 'ImportExpression':
        push(node, 'error', 'import() no está soportado', 'unsupported', hintFor('unsupported'));
        return;
      case 'WithStatement':
        push(node, 'error', 'with no está soportado', 'unsupported', hintFor('unsupported'));
        return;
      case 'CallExpression':
        if (node.callee.type === 'MemberExpression' && !node.callee.computed &&
            node.callee.property.type === 'Identifier' && node.callee.property.name === 'sort') {
          push(node.callee.property, 'info', '.sort() modifica el arreglo original en su lugar. Si deseas conservar el orden original, considera usar .toSorted() o hacer una copia antes (...arr)', 'sort-mutates');
        }
        visit(node.callee, scope);
        for (const arg of node.arguments) visit(arg, scope);
        return;
      case 'ExpressionStatement':
        if (node.expression.type === 'BinaryExpression' && ['==', '==='].includes(node.expression.operator))
          push(node, 'warning', 'Comparación que no se usa. ¿Quisiste asignar con =?', 'unused-expression');
        visit(node.expression, scope);
        return;
      case 'MetaProperty':
      case 'Literal':
      case 'ThisExpression':
      case 'Super':
      case 'PrivateIdentifier':
      case 'EmptyStatement':
      case 'DebuggerStatement':
        return;
    }
    for (const k of Object.keys(node)) {
      if (k === 'type' || k === 'loc' || k === 'start' || k === 'end') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach((x) => x && typeof x.type === 'string' && visit(x, scope));
      else if (v && typeof v.type === 'string') visit(v, scope);
    }
  }

  const root = newScope(null, ast);
  visit(ast, root);

  // Variables no resueltas
  const implicitNames = new Set(unresolved.filter((u) => u.write && !u.read).map((u) => u.node.name));
  const allNames = new Set<string>([...BUILTIN_NAMES]);
  for (const s of allScopes) for (const k of s.decls.keys()) allNames.add(k);
  for (const u of unresolved) {
    const name = u.node.name;
    if (u.typeofCheck) continue;
    if (UNAVAILABLE[name]) {
      push(u.node, 'error', UNAVAILABLE[name], 'unavailable', hintFor('unsupported'));
      continue;
    }
    if (u.write && !u.read) {
      if (profile.allowImplicitGlobals) push(u.node, 'info', `'${name}' no está declarada: se creará como variable global. Mejor usa let ${name}`, 'implicit-global');
      else push(u.node, 'error', `La variable '${name}' no ha sido declarada. Usa let ${name} = ...`, 'undeclared', hintFor('undeclared-assign'));
      continue;
    }
    if (profile.allowImplicitGlobals && implicitNames.has(name)) continue;
    const sim = closest(name, allNames);
    push(u.node, 'error', `'${name}' no está definida${sim ? `. ¿Quisiste decir '${sim}'?` : ''}`, 'undefined', hintFor('undefined-var'));
  }

  // Variables sin usar / const preferido
  for (const s of allScopes) {
    for (const d of s.decls.values()) {
      if (d.name.startsWith('_')) continue;
      if (profile.warnUnused && d.reads === 0 && ['let', 'const', 'var', 'function', 'class'].includes(d.kind)) {
        push(d.node, 'warning', `'${d.name}' se declara pero nunca se usa`, 'unused');
      }
      if (profile.preferConst && d.kind === 'let' && d.writes === 0 && d.hasInit) {
        push(d.node, 'info', `'${d.name}' nunca se reasigna: puedes declararla con const`, 'prefer-const');
      }
    }
  }

  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  diags.sort((a, b) => a.line - b.line || a.col - b.col || order[a.severity] - order[b.severity]);
  // Elimina duplicados exactos
  return diags.filter((d, i) => i === 0 || !(d.line === diags[i - 1].line && d.col === diags[i - 1].col && d.message === diags[i - 1].message));
}

export function hasBlockingErrors(diags: Diagnostic[]): boolean {
  return diags.some((d) => d.severity === 'error' && BLOCKING_RULES.has(d.rule));
}
