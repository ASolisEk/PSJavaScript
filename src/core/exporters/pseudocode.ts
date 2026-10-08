/** Exporta JavaScript a pseudocódigo de PSeInt. */
import { ExportResult, N, Writer, forRange, functionHasReturnValue, literalType, parse, readOf, templateParts } from './common';

const PREC: Record<string, number> = { O: 1, Y: 2, '=': 3, '<>': 3, '<': 4, '>': 4, '<=': 4, '>=': 4, '+': 5, '-': 5, '*': 6, '/': 6, MOD: 6, '^': 7 };

const OP: Record<string, string> = {
  '===': '=', '==': '=', '!==': '<>', '!=': '<>', '&&': 'Y', '||': 'O', '%': 'MOD', '**': '^',
  '<': '<', '>': '>', '<=': '<=', '>=': '>=', '+': '+', '-': '-', '*': '*', '/': '/',
};

const NEGATE: Record<string, string> = { '<': '>=', '>=': '<', '>': '<=', '<=': '>', '===': '<>', '==': '<>', '!==': '=', '!=': '=' };

const MATH: Record<string, string> = {
  sqrt: 'raiz', abs: 'abs', trunc: 'trunc', round: 'redon', log: 'ln', exp: 'exp', sin: 'sen', cos: 'cos', tan: 'tan',
  asin: 'asen', acos: 'acos', atan: 'atan',
};

const TYPE_NAMES: Record<string, string> = { int: 'Entero', float: 'Real', string: 'Caracter', bool: 'Logico' };

export function toPseudocode(code: string, name = 'programa'): ExportResult {
  const ast = parse(code);
  const w = new Writer('    ');
  const warnings: string[] = [];
  const src = (n: N) => code.slice(n.start, n.end).replace(/\s+/g, ' ');
  const warn = (n: N, msg: string) => {
    warnings.push(`Línea ${n.loc.start.line}: ${msg}`);
  };
  let returnVar: string | null = null;
  let lastStmt: N = null;

  const prec = (op: string) => PREC[op] ?? 8;

  const expr = (e: N, parent = 0): string => {
    switch (e.type) {
      case 'Literal':
        if (typeof e.value === 'string') return `"${e.value.replace(/"/g, "'")}"`;
        if (typeof e.value === 'boolean') return e.value ? 'Verdadero' : 'Falso';
        if (e.value === null) return '""';
        return String(e.raw);
      case 'Identifier':
        if (e.name === 'undefined') return '""';
        if (e.name === 'Infinity') return '999999999';
        return e.name;
      case 'TemplateLiteral':
        return templateParts(e).map((p) => ('text' in p ? `"${p.text.replace(/"/g, "'")}"` : expr(p.expr, 5))).join(' + ') || '""';
      case 'BinaryExpression':
      case 'LogicalExpression': {
        if (e.operator === '??') return expr(e.left, parent);
        const op = OP[e.operator];
        if (!op) {
          warn(e, `operador ${e.operator} sin equivalente`);
          return src(e);
        }
        if (op === '^') return `${expr(e.left, 8)}^${expr(e.right, 8)}`;
        const p = prec(op);
        const s = `${expr(e.left, p)} ${op} ${expr(e.right, p + 0.5)}`;
        return p < parent ? `(${s})` : s;
      }
      case 'UnaryExpression':
        if (e.operator === '!') return `NO ${expr(e.argument, 8)}`;
        if (e.operator === '-') return `-${expr(e.argument, 8)}`;
        if (e.operator === '+') return `ConvertirANumero(${expr(e.argument)})`;
        if (e.operator === 'typeof') {
          warn(e, 'typeof no existe en PSeInt');
          return src(e);
        }
        return src(e);
      case 'ConditionalExpression':
        warn(e, 'el operador ternario no existe en PSeInt; se usa una aproximación');
        return `(${expr(e.consequent)}) // si ${expr(e.test)}, si no ${expr(e.alternate)}`;
      case 'MemberExpression': {
        if (e.computed) return `${expr(e.object, 9)}[${expr(e.property)}]`;
        const prop = e.property.name;
        if (e.object.type === 'Identifier' && e.object.name === 'Math') {
          if (prop === 'PI') return 'PI';
          if (prop === 'E') return 'exp(1)';
        }
        if (prop === 'length') return `Longitud(${expr(e.object)})`;
        warn(e, `acceso a propiedad '${src(e)}' (PSeInt no tiene objetos)`);
        return `${expr(e.object, 9)}.${prop}`;
      }
      case 'CallExpression':
        return call(e);
      case 'ArrayExpression':
        warn(e, 'arreglo literal en expresión');
        return `[${e.elements.map((x: N) => (x ? expr(x) : '')).join(', ')}]`;
      case 'AssignmentExpression':
      case 'UpdateExpression':
        warn(e, 'asignación dentro de una expresión');
        return src(e);
      case 'ChainExpression':
        return expr(e.expression, parent);
    }
    warn(e, `expresión no convertible: ${src(e)}`);
    return src(e);
  };

  const call = (e: N): string => {
    const r = azar(e);
    if (r) return r;
    const c = e.callee;
    const args = e.arguments.map((a: N) => expr(a));
    if (c.type === 'MemberExpression' && !c.computed) {
      const obj = c.object;
      const m = c.property.name;
      if (obj.type === 'Identifier' && obj.name === 'Math') {
        if (MATH[m]) return `${MATH[m]}(${args.join(', ')})`;
        if (m === 'floor') return `trunc(${args[0]})`;
        if (m === 'ceil') return `trunc(${args[0]}) + 1`;
        if (m === 'pow') return `${expr(e.arguments[0], 8)}^${expr(e.arguments[1], 8)}`;
        if (m === 'random') return 'azar(1000000) / 1000000';
        warn(e, `Math.${m} no existe en PSeInt`);
        return `${m}(${args.join(', ')})`;
      }
      const target = expr(obj, 9);
      switch (m) {
        case 'toUpperCase':
          return `Mayusculas(${target})`;
        case 'toLowerCase':
          return `Minusculas(${target})`;
        case 'substring':
        case 'slice':
          return e.arguments.length > 1 ? `Subcadena(${target}, ${args[0]}, ${args[1]} - 1)` : `Subcadena(${target}, ${args[0]}, Longitud(${target}) - 1)`;
        case 'charAt':
          return `Subcadena(${target}, ${args[0]}, ${args[0]})`;
        case 'toString':
          return `ConvertirATexto(${target})`;
        case 'toFixed':
          return `redon(${target})`;
        case 'concat':
          return `Concatenar(${target}, ${args[0]})`;
      }
      warn(e, `método '${m}' sin equivalente directo en PSeInt`);
      return `${target}.${m}(${args.join(', ')})`;
    }
    if (c.type === 'Identifier') {
      switch (c.name) {
        case 'Number':
        case 'parseFloat':
          return `ConvertirANumero(${args[0]})`;
        case 'parseInt':
          return `trunc(ConvertirANumero(${args[0]}))`;
        case 'String':
          return `ConvertirATexto(${args[0]})`;
      }
    }
    // Math.floor(Math.random() * n) → azar(n)
    return `${expr(c, 9)}(${args.join(', ')})`;
  };

  const azar = (e: N): string | null => {
    // Math.floor(Math.random() * n) [+ a]
    const isRand = (x: N) => x?.type === 'CallExpression' && src(x.callee) === 'Math.random';
    if (e?.type === 'CallExpression' && src(e.callee) === 'Math.floor' && e.arguments[0]?.type === 'BinaryExpression' && e.arguments[0].operator === '*') {
      const b = e.arguments[0];
      if (isRand(b.left)) return `azar(${expr(b.right)})`;
      if (isRand(b.right)) return `azar(${expr(b.left)})`;
    }
    return null;
  };

  const value = (e: N): string => azar(e) ?? expr(e);

  const cond = (e: N) => expr(e);

  const negate = (e: N): string => {
    if (e.type === 'BinaryExpression' && NEGATE[e.operator]) return `${expr(e.left, 5)} ${OP[NEGATE[e.operator]] ?? NEGATE[e.operator]} ${expr(e.right, 5)}`;
    if (e.type === 'UnaryExpression' && e.operator === '!') return expr(e.argument);
    return `NO (${expr(e)})`;
  };

  const writeArgs = (args: N[]) => {
    const parts: string[] = [];
    for (const a of args) {
      if (a.type === 'TemplateLiteral') for (const p of templateParts(a)) parts.push('text' in p ? `"${p.text.replace(/"/g, "'")}"` : expr(p.expr));
      else parts.push(value(a));
    }
    return parts;
  };

  const assign = (target: string, e: N, decl: N) => {
    const r = readOf(e);
    if (r) {
      if (r.prompt) w.line(`Escribir ${expr(r.prompt)};`);
      w.line(`Leer ${target};`);
      return;
    }
    if (e.type === 'ArrayExpression') {
      w.line(`Dimensionar ${target}[${Math.max(e.elements.length, 1)}];`);
      e.elements.forEach((x: N, i: number) => x && w.line(`${target}[${i}] <- ${value(x)};`));
      if (!e.elements.length) warn(decl, `arreglo vacío '${target}': ajusta el tamaño en Dimensionar`);
      return;
    }
    if (e.type === 'NewExpression' && e.callee.name === 'Array') {
      w.line(`Dimensionar ${target}[${e.arguments[0] ? expr(e.arguments[0]) : 100}];`);
      return;
    }
    if (e.type === 'ArrowFunctionExpression' || e.type === 'FunctionExpression') return;
    w.line(`${target} <- ${value(e)};`);
  };

  const stmt = (s: N) => {
    switch (s.type) {
      case 'VariableDeclaration':
        for (const d of s.declarations) {
          if (d.id.type !== 'Identifier') {
            warn(d, 'desestructuración no soportada');
            w.line(`// ${src(d)}`);
            continue;
          }
          if (d.init && /FunctionExpression|ArrowFunctionExpression/.test(d.init.type)) continue;
          const t = literalType(d.init);
          if (TYPE_NAMES[t]) w.line(`Definir ${d.id.name} Como ${TYPE_NAMES[t]};`);
          if (d.init) assign(d.id.name, d.init, d);
        }
        return;
      case 'ExpressionStatement': {
        const e = s.expression;
        if (e.type === 'CallExpression') {
          const callee = src(e.callee);
          if (/^console\.(log|info|warn|error)$/.test(callee) || callee === 'alert') {
            w.line(`Escribir ${writeArgs(e.arguments).join(', ') || '""'};`);
            return;
          }
          if (callee === 'console.clear') {
            w.line('Borrar Pantalla;');
            return;
          }
          if (e.callee.type === 'MemberExpression' && e.callee.property.name === 'push') {
            warn(s, 'push no existe en PSeInt: los arreglos tienen tamaño fijo');
            w.line(`// ${src(e)}  (agregar al final del arreglo)`);
            return;
          }
          if (readOf(e)) {
            const r = readOf(e)!;
            if (r.prompt) w.line(`Escribir ${expr(r.prompt)};`);
            w.line('Esperar Tecla;');
            return;
          }
          w.line(`${call(e)};`);
          return;
        }
        if (e.type === 'AssignmentExpression' && (e.left.type === 'Identifier' || e.left.type === 'MemberExpression')) {
          const target = expr(e.left);
          if (e.operator === '=') assign(target, e.right, s);
          else {
            const op = OP[e.operator.slice(0, -1)];
            w.line(`${target} <- ${target} ${op ?? e.operator.slice(0, -1)} ${expr(e.right, 6)};`);
          }
          return;
        }
        if (e.type === 'UpdateExpression') {
          const target = expr(e.argument);
          w.line(`${target} <- ${target} ${e.operator === '++' ? '+' : '-'} 1;`);
          return;
        }
        warn(s, 'expresión sin efecto en PSeInt');
        w.line(`// ${src(s)}`);
        return;
      }
      case 'IfStatement':
        w.line(`Si ${cond(s.test)} Entonces`);
        w.indent(() => body(s.consequent));
        if (s.alternate) {
          w.line('SiNo');
          w.indent(() => body(s.alternate));
        }
        w.line('FinSi');
        return;
      case 'WhileStatement':
        w.line(`Mientras ${cond(s.test)} Hacer`);
        w.indent(() => body(s.body));
        w.line('FinMientras');
        return;
      case 'DoWhileStatement':
        w.line('Repetir');
        w.indent(() => body(s.body));
        w.line(`Hasta Que ${negate(s.test)}`);
        return;
      case 'ForStatement': {
        const r = forRange(s);
        if (r) {
          let end: string;
          if (r.inclusive) end = expr(r.end);
          else if (r.end.type === 'Literal' && typeof r.end.value === 'number') end = String(r.end.value - Math.sign(r.step));
          else if (
            r.step > 0 &&
            r.end.type === 'BinaryExpression' &&
            (r.end.operator === '-' || r.end.operator === '+') &&
            r.end.right.type === 'Literal' &&
            typeof r.end.right.value === 'number'
          ) {
            // n - 1 (exclusivo) → n - 2 ; n + 1 → n
            const k = r.end.operator === '-' ? r.end.right.value + 1 : r.end.right.value - 1;
            end = k === 0 ? expr(r.end.left, 5) : `${expr(r.end.left, 5)} ${k > 0 ? '-' : '+'} ${Math.abs(k)}`;
          }
          else end = `${expr(r.end, 5)} ${r.step > 0 ? '-' : '+'} 1`;
          w.line(`Para ${r.name} <- ${value(r.start)} Hasta ${end} Con Paso ${r.step} Hacer`);
          w.indent(() => body(s.body));
          w.line('FinPara');
          return;
        }
        if (s.init) stmt(s.init.type === 'VariableDeclaration' ? s.init : { type: 'ExpressionStatement', expression: s.init, loc: s.loc, start: s.init.start, end: s.init.end });
        w.line(`Mientras ${s.test ? cond(s.test) : 'Verdadero'} Hacer`);
        w.indent(() => {
          body(s.body);
          if (s.update) stmt({ type: 'ExpressionStatement', expression: s.update, loc: s.loc, start: s.update.start, end: s.update.end });
        });
        w.line('FinMientras');
        return;
      }
      case 'ForOfStatement':
      case 'ForInStatement': {
        const v = s.left.type === 'VariableDeclaration' ? src(s.left.declarations[0].id) : src(s.left);
        if (s.type === 'ForInStatement') warn(s, 'for...in recorre índices/claves');
        w.line(`Para Cada ${v} de ${expr(s.right)} Hacer`);
        w.indent(() => body(s.body));
        w.line('FinPara');
        return;
      }
      case 'SwitchStatement': {
        w.line(`Segun ${expr(s.discriminant)} Hacer`);
        w.indent(() => {
          let labels: string[] = [];
          for (const c of s.cases) {
            if (!c.consequent.length && c.test) {
              labels.push(expr(c.test));
              continue;
            }
            if (c.test) {
              labels.push(expr(c.test));
              w.line(`${labels.join(', ')}:`);
            } else w.line('De Otro Modo:');
            labels = [];
            w.indent(() => c.consequent.filter((x: N) => x.type !== 'BreakStatement').forEach(stmt));
          }
        });
        w.line('FinSegun');
        return;
      }
      case 'BlockStatement':
        s.body.forEach(stmt);
        return;
      case 'ReturnStatement':
        if (s !== lastStmt) warn(s, 'return antes del final de la función: en PSeInt la función no termina ahí, revisa la lógica');
        if (returnVar && s.argument) w.line(`${returnVar} <- ${value(s.argument)};`);
        else if (s.argument) w.line(`// return ${src(s.argument)}`);
        return;
      case 'BreakStatement':
      case 'ContinueStatement':
        warn(s, `${s.type === 'BreakStatement' ? 'break' : 'continue'} no existe en PSeInt: reestructura el ciclo`);
        w.line(`// ${src(s)}`);
        return;
      case 'FunctionDeclaration':
      case 'EmptyStatement':
        return;
      case 'TryStatement':
        warn(s, 'try/catch no existe en PSeInt');
        s.block.body.forEach(stmt);
        return;
      case 'ThrowStatement':
        w.line(`Escribir "Error: ", ${expr(s.argument.type === 'NewExpression' ? s.argument.arguments[0] ?? s.argument : s.argument)};`);
        return;
    }
    warn(s, `instrucción no convertible (${s.type})`);
    w.line(`// No convertible: ${src(s)}`);
  };

  const body = (s: N) => {
    if (s.type === 'BlockStatement') s.body.forEach(stmt);
    else stmt(s);
  };

  const fn = (name: string, f: N) => {
    const params = f.params.map((p: N) => (p.type === 'Identifier' ? p.name : p.type === 'AssignmentPattern' ? p.left.name : src(p))).join(', ');
    const hasRet = functionHasReturnValue(f);
    lastStmt = f.body.type === 'BlockStatement' ? f.body.body[f.body.body.length - 1] : null;
    returnVar = hasRet ? 'resultado' : null;
    w.line(hasRet ? `Funcion resultado <- ${name}(${params})` : `SubProceso ${name}(${params})`);
    w.indent(() => {
      if (f.body.type === 'BlockStatement') f.body.body.forEach(stmt);
      else w.line(`resultado <- ${value(f.body)};`);
    });
    w.line(hasRet ? 'FinFuncion' : 'FinSubProceso');
    w.line();
    returnVar = null;
  };

  w.line('// Pseudocódigo generado por PSJavaScript a partir de JavaScript');
  w.line('// Perfil sugerido en PSeInt: Flexible, arreglos en base 0');
  w.line();

  for (const s of ast.body) {
    if (s.type === 'FunctionDeclaration') fn(s.id.name, s);
    if (s.type === 'VariableDeclaration')
      for (const d of s.declarations) if (d.init && /FunctionExpression|ArrowFunctionExpression/.test(d.init.type) && d.id.type === 'Identifier') fn(d.id.name, d.init);
    if (s.type === 'ClassDeclaration') warn(s, `las clases no existen en PSeInt (class ${s.id.name} omitida)`);
  }

  w.line(`Algoritmo ${name.replace(/[^A-Za-z0-9_]/g, '_') || 'programa'}`);
  w.indent(() => {
    for (const s of ast.body) {
      if (s.type === 'ClassDeclaration') {
        w.line(`// No convertible: class ${s.id.name}`);
        continue;
      }
      stmt(s);
    }
  });
  w.line('FinAlgoritmo');
  return { code: w.toString(), warnings };
}
