/** Exporta JavaScript a Python 3. */
import { ExportResult, N, Writer, forRange, isStringy, parse, str, templateParts } from './common';

const PREC: Record<string, number> = {
  or: 1, and: 2, not: 3, '==': 4, '!=': 4, '<': 4, '>': 4, '<=': 4, '>=': 4, in: 4, '|': 5, '^': 6, '&': 7, '<<': 8, '>>': 8,
  '+': 9, '-': 9, '*': 10, '/': 10, '%': 10, '//': 10, '**': 12,
};
const OP: Record<string, string> = {
  '===': '==', '==': '==', '!==': '!=', '!=': '!=', '&&': 'and', '||': 'or', '<': '<', '>': '>', '<=': '<=', '>=': '>=',
  '+': '+', '-': '-', '*': '*', '/': '/', '%': '%', '**': '**', '&': '&', '|': '|', '^': '^', '<<': '<<', '>>': '>>',
};
const MATH_DIRECT: Record<string, string> = {
  sqrt: 'math.sqrt', floor: 'math.floor', ceil: 'math.ceil', trunc: 'math.trunc', log: 'math.log', exp: 'math.exp',
  sin: 'math.sin', cos: 'math.cos', tan: 'math.tan', asin: 'math.asin', acos: 'math.acos', atan: 'math.atan', atan2: 'math.atan2',
  log10: 'math.log10', log2: 'math.log2', hypot: 'math.hypot', abs: 'abs', max: 'max', min: 'min', round: 'round', pow: 'pow',
};

export function toPython(code: string): ExportResult {
  const ast = parse(code);
  const w = new Writer('    ');
  const warnings: string[] = [];
  const imports = new Set<string>();
  const dicts = new Set<string>();
  const src = (n: N) => code.slice(n.start, n.end).replace(/\s+/g, ' ');
  const warn = (n: N, msg: string) => warnings.push(`Línea ${n.loc.start.line}: ${msg}`);
  let usesNumero = false;
  const numero = (a: string) => {
    usesNumero = true;
    return `numero(${a})`;
  };
  let lambdaCount = 0;

  // Variables declaradas con objetos literales → se tratan como dict
  const scanDicts = (x: N) => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(scanDicts);
    if (x.type === 'VariableDeclarator' && x.id.type === 'Identifier' && x.init?.type === 'ObjectExpression') dicts.add(x.id.name);
    for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') scanDicts(x[k]);
  };
  scanDicts(ast);

  const wrap = (s: string, p: number, parent: number) => (p < parent ? `(${s})` : s);

  const toStr = (e: N) => (isStringy(e) ? expr(e) : `str(${expr(e)})`);

  const lambda = (f: N): string => {
    const params = f.params.map(param).join(', ');
    if (f.expression) return `lambda ${params}: ${expr(f.body)}`;
    const b = f.body.body;
    if (b.length === 1 && b[0].type === 'ReturnStatement' && b[0].argument) return `lambda ${params}: ${expr(b[0].argument)}`;
    warn(f, 'función con cuerpo de varias líneas usada como valor: se extrae como def');
    const name = `_funcion${++lambdaCount}`;
    pendingDefs.push({ name, f });
    return name;
  };
  const pendingDefs: { name: string; f: N }[] = [];

  const param = (p: N): string => {
    if (p.type === 'Identifier') return p.name;
    if (p.type === 'AssignmentPattern') return `${p.left.name}=${expr(p.right)}`;
    if (p.type === 'RestElement') return `*${p.argument.name}`;
    warn(p, 'parámetro desestructurado');
    return src(p);
  };

  const expr = (e: N, parent = 0): string => {
    switch (e.type) {
      case 'Literal':
        if (e.regex) {
          imports.add('re');
          return `re.compile(${str(e.regex.pattern)})`;
        }
        if (typeof e.value === 'string') return str(e.value);
        if (typeof e.value === 'boolean') return e.value ? 'True' : 'False';
        if (e.value === null) return 'None';
        return String(e.raw).replace(/n$/, '');
      case 'Identifier':
        if (e.name === 'undefined') return 'None';
        if (e.name === 'Infinity') return "float('inf')";
        if (e.name === 'NaN') return "float('nan')";
        return e.name;
      case 'ThisExpression':
        return 'self';
      case 'TemplateLiteral': {
        const s = templateParts(e)
          .map((p) => ('text' in p ? p.text.replace(/[{}]/g, (c) => c + c).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') : `{${expr(p.expr)}}`))
          .join('');
        return `f"${s}"`;
      }
      case 'ArrayExpression':
        return `[${e.elements.map((x: N) => (x ? (x.type === 'SpreadElement' ? `*${expr(x.argument)}` : expr(x)) : 'None')).join(', ')}]`;
      case 'ObjectExpression':
        return `{${e.properties
          .map((p: N) => {
            if (p.type === 'SpreadElement') return `**${expr(p.argument)}`;
            const k = p.computed ? expr(p.key) : str(p.key.name ?? String(p.key.value));
            return `${k}: ${p.value.type.includes('Function') ? lambda(p.value) : expr(p.value)}`;
          })
          .join(', ')}}`;
      case 'BinaryExpression': {
        if (e.operator === 'instanceof') return `isinstance(${expr(e.left)}, ${expr(e.right)})`;
        if (e.operator === 'in') return wrap(`${expr(e.left, 5)} in ${expr(e.right, 5)}`, 4, parent);
        if (e.operator === '+' && (isStringy(e.left) || isStringy(e.right))) {
          return wrap(`${toStr(e.left)} + ${toStr(e.right)}`, 9, parent);
        }
        const op = OP[e.operator] ?? e.operator;
        const p = PREC[op] ?? 9;
        return wrap(`${expr(e.left, p)} ${op} ${expr(e.right, p + 1)}`, p, parent);
      }
      case 'LogicalExpression': {
        if (e.operator === '??') {
          const l = expr(e.left, 13);
          return wrap(`${l} if ${l} is not None else ${expr(e.right, 1)}`, 0, parent);
        }
        const op = OP[e.operator];
        const p = PREC[op];
        return wrap(`${expr(e.left, p)} ${op} ${expr(e.right, p + 1)}`, p, parent);
      }
      case 'UnaryExpression':
        if (e.operator === '!') return wrap(`not ${expr(e.argument, 3)}`, 3, parent);
        if (e.operator === 'typeof') return `type(${expr(e.argument)}).__name__`;
        if (e.operator === '+') return numero(expr(e.argument));
        if (e.operator === 'void') return 'None';
        return `${e.operator}${expr(e.argument, 11)}`;
      case 'ConditionalExpression':
        return wrap(`${expr(e.consequent, 1)} if ${expr(e.test, 1)} else ${expr(e.alternate, 0)}`, 0, parent);
      case 'MemberExpression': {
        const obj = expr(e.object, 13);
        if (e.computed) return `${obj}[${expr(e.property)}]`;
        const prop = e.property.type === 'PrivateIdentifier' ? `_${e.property.name}` : e.property.name;
        if (e.object.type === 'Identifier' && e.object.name === 'Math') {
          imports.add('math');
          if (prop === 'PI') return 'math.pi';
          if (prop === 'E') return 'math.e';
        }
        if (prop === 'length') return `len(${expr(e.object)})`;
        if (e.object.type === 'Identifier' && dicts.has(e.object.name)) return `${obj}[${str(prop)}]`;
        if (prop === 'message' && e.object.type === 'Identifier') return `str(${obj})`;
        return `${obj}.${prop}`;
      }
      case 'ChainExpression':
        return expr(e.expression, parent);
      case 'CallExpression':
        return call(e);
      case 'NewExpression': {
        const name = src(e.callee);
        const args = e.arguments.map((a: N) => expr(a));
        if (name === 'Error' || name === 'TypeError' || name === 'RangeError') return `Exception(${args.join(', ')})`;
        if (name === 'Array') return `[None] * ${args[0] ?? 0}`;
        if (name === 'Map') return 'dict()';
        if (name === 'Set') return `set(${args.join(', ')})`;
        if (name === 'Date') {
          imports.add('datetime');
          return 'datetime.datetime.now()';
        }
        return `${expr(e.callee, 13)}(${args.join(', ')})`;
      }
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return lambda(e);
      case 'AssignmentExpression':
        warn(e, 'asignación dentro de una expresión: se usa el operador :=');
        return `(${expr(e.left)} := ${expr(e.right)})`;
      case 'UpdateExpression':
        warn(e, '++/-- dentro de una expresión no existe en Python');
        return `(${expr(e.argument)} := ${expr(e.argument)} ${e.operator === '++' ? '+' : '-'} 1)`;
      case 'SequenceExpression':
        return e.expressions.map((x: N) => expr(x)).join(', ');
      case 'SpreadElement':
        return `*${expr(e.argument)}`;
    }
    warn(e, `expresión no convertible: ${src(e)}`);
    return src(e);
  };

  const call = (e: N): string => {
    const c = e.callee;
    const args = e.arguments.map((a: N) => expr(a));
    if (c.type === 'Super') return `super().__init__(${args.join(', ')})`;
    if (c.type === 'MemberExpression' && !c.computed) {
      const m = c.property.name;
      const objNode = c.object;
      if (objNode.type === 'Super') return `super().${m}(${args.join(', ')})`;
      if (objNode.type === 'Identifier') {
        const o = objNode.name;
        if (o === 'Math') {
          if (m === 'random') {
            imports.add('random');
            return 'random.random()';
          }
          if (MATH_DIRECT[m]) {
            if (MATH_DIRECT[m].startsWith('math.')) imports.add('math');
            return `${MATH_DIRECT[m]}(${args.join(', ')})`;
          }
        }
        if (o === 'console') return `print(${args.join(', ')})`;
        if (o === 'JSON') {
          imports.add('json');
          if (m === 'stringify') return `json.dumps(${args.join(', ')})`;
          if (m === 'parse') return `json.loads(${args.join(', ')})`;
        }
        if (o === 'Object') {
          if (m === 'keys') return `list(${args[0]}.keys())`;
          if (m === 'values') return `list(${args[0]}.values())`;
          if (m === 'entries') return `list(${args[0]}.items())`;
        }
        if (o === 'Number' && m === 'isInteger') return `float(${args[0]}).is_integer()`;
        if (o === 'Array' && m === 'isArray') return `isinstance(${args[0]}, list)`;
      }
      const t = expr(objNode, 13);
      const fnArg = e.arguments[0];
      const cb = () => (fnArg && /Function/.test(fnArg.type) ? lambda(fnArg) : args[0]);
      switch (m) {
        case 'push':
          return args.length === 1 ? `${t}.append(${args[0]})` : `${t}.extend([${args.join(', ')}])`;
        case 'pop':
          return `${t}.pop()`;
        case 'shift':
          return `${t}.pop(0)`;
        case 'unshift':
          return `${t}.insert(0, ${args[0]})`;
        case 'toUpperCase':
          return `${t}.upper()`;
        case 'toLowerCase':
          return `${t}.lower()`;
        case 'trim':
          return `${t}.strip()`;
        case 'includes':
          return `(${args[0]} in ${t})`;
        case 'indexOf':
          return `(${t}.index(${args[0]}) if ${args[0]} in ${t} else -1)`;
        case 'join':
          return `${args[0] ?? '","'}.join(map(str, ${t}))`;
        case 'split':
          return `${t}.split(${args[0] ?? ''})`;
        case 'slice':
        case 'substring':
          return `${t}[${args[0] ?? ''}:${args[1] ?? ''}]`;
        case 'charAt':
          return `${t}[${args[0]}]`;
        case 'startsWith':
          return `${t}.startswith(${args[0]})`;
        case 'endsWith':
          return `${t}.endswith(${args[0]})`;
        case 'replace':
          return `${t}.replace(${args[0]}, ${args[1]}, 1)`;
        case 'replaceAll':
          return `${t}.replace(${args[0]}, ${args[1]})`;
        case 'repeat':
          return `${t} * ${args[0]}`;
        case 'toString':
          return `str(${t})`;
        case 'toFixed':
          return `format(${t}, ".${e.arguments[0]?.value ?? 0}f")`;
        case 'reverse':
          return `${t}.reverse()`;
        case 'concat':
          return `${t} + ${args[0]}`;
        case 'map':
          return `list(map(${cb()}, ${t}))`;
        case 'filter':
          return `list(filter(${cb()}, ${t}))`;
        case 'forEach':
          return `[${cb()}(x) for x in ${t}]`;
        case 'reduce':
          imports.add('functools');
          return `functools.reduce(${cb()}, ${t}${args[1] ? `, ${args[1]}` : ''})`;
        case 'some':
          return `any(${cb()}(x) for x in ${t})`;
        case 'every':
          return `all(${cb()}(x) for x in ${t})`;
        case 'find':
          return `next((x for x in ${t} if (${cb()})(x)), None)`;
        case 'sort':
          if (fnArg) {
            imports.add('functools');
            return `${t}.sort(key=functools.cmp_to_key(${cb()}))`;
          }
          return `${t}.sort()`;
        case 'has':
          return `(${args[0]} in ${t})`;
        case 'get':
          return `${t}.get(${args[0]})`;
        case 'set':
          return `${t}.__setitem__(${args[0]}, ${args[1]})`;
        case 'add':
          return `${t}.add(${args[0]})`;
      }
      return `${t}.${m}(${args.join(', ')})`;
    }
    if (c.type === 'Identifier') {
      switch (c.name) {
        case 'prompt':
          return `input(${args[0] ?? ''})`;
        case 'confirm':
          return `input(${args[0] ?? '""'} + " (s/n) ").strip().lower().startswith("s")`;
        case 'alert':
          return `print(${args.join(', ')})`;
        case 'Number':
        case 'parseFloat':
          return numero(args[0]);
        case 'parseInt':
          return `int(float(${args[0]}))`;
        case 'String':
          return `str(${args[0]})`;
        case 'Boolean':
          return `bool(${args[0]})`;
        case 'isNaN':
          imports.add('math');
          return `math.isnan(${args[0]})`;
      }
    }
    return `${expr(c, 13)}(${args.join(', ')})`;
  };

  const target = (p: N): string => {
    if (p.type === 'ArrayPattern') return p.elements.map((x: N) => (x ? (x.type === 'RestElement' ? `*${x.argument.name}` : target(x)) : '_')).join(', ');
    if (p.type === 'ObjectPattern') {
      warn(p, 'desestructuración de objetos: se asignan las claves por separado');
      return p.properties.map((q: N) => target(q.value)).join(', ');
    }
    return expr(p);
  };

  const stmt = (s: N) => {
    switch (s.type) {
      case 'VariableDeclaration':
        for (const d of s.declarations) {
          if (d.init && /FunctionExpression|ArrowFunctionExpression/.test(d.init.type) && d.id.type === 'Identifier') {
            defn(d.id.name, d.init);
            continue;
          }
          if (d.id.type === 'ObjectPattern' && d.init) {
            const tmp = expr(d.init);
            for (const q of d.id.properties) if (q.type !== 'RestElement') w.line(`${target(q.value)} = ${tmp}[${str(q.key.name ?? String(q.key.value))}]`);
            continue;
          }
          w.line(`${target(d.id)} = ${d.init ? expr(d.init) : 'None'}`);
        }
        return;
      case 'ExpressionStatement': {
        const e = s.expression;
        if (e.type === 'AssignmentExpression') {
          const op = e.operator;
          if (op === '=') w.line(`${target(e.left)} = ${expr(e.right)}`);
          else if (op === '&&=' || op === '||=' || op === '??=') {
            const t = expr(e.left);
            w.line(`${t} = ${t} ${op === '&&=' ? 'and' : 'or'} ${expr(e.right)}`);
          } else {
            const base = op.slice(0, -1);
            if (base === '+' && (isStringy(e.right) || isStringy(e.left))) w.line(`${expr(e.left)} += ${toStr(e.right)}`);
            else w.line(`${expr(e.left)} ${(OP[base] ?? base)}= ${expr(e.right)}`);
          }
          return;
        }
        if (e.type === 'UpdateExpression') {
          w.line(`${expr(e.argument)} ${e.operator === '++' ? '+' : '-'}= 1`);
          return;
        }
        if (e.type === 'CallExpression' && e.callee.type === 'MemberExpression' && e.callee.property.name === 'forEach' && e.arguments[0] && /Function/.test(e.arguments[0].type)) {
          const f = e.arguments[0];
          const v = f.params[0] ? param(f.params[0]) : '_';
          const idx = f.params[1] ? param(f.params[1]) : null;
          w.line(idx ? `for ${idx}, ${v} in enumerate(${expr(e.callee.object)}):` : `for ${v} in ${expr(e.callee.object)}:`);
          w.indent(() => (f.expression ? w.line(expr(f.body)) : blockBody(f.body)));
          return;
        }
        w.line(expr(e));
        return;
      }
      case 'IfStatement': {
        w.line(`if ${expr(s.test)}:`);
        w.indent(() => blockBody(s.consequent));
        let alt = s.alternate;
        while (alt && alt.type === 'IfStatement') {
          w.line(`elif ${expr(alt.test)}:`);
          const cons = alt.consequent;
          w.indent(() => blockBody(cons));
          alt = alt.alternate;
        }
        if (alt) {
          w.line('else:');
          w.indent(() => blockBody(alt));
        }
        return;
      }
      case 'WhileStatement':
        w.line(`while ${expr(s.test)}:`);
        w.indent(() => blockBody(s.body));
        return;
      case 'DoWhileStatement':
        w.line('while True:');
        w.indent(() => {
          blockBody(s.body);
          w.line(`if not (${expr(s.test)}):`);
          w.indent(() => w.line('break'));
        });
        return;
      case 'ForStatement': {
        const r = forRange(s);
        if (r) {
          let end = r.inclusive
            ? r.end.type === 'Literal'
              ? String(r.end.value + Math.sign(r.step))
              : `${expr(r.end, 9)} ${r.step > 0 ? '+' : '-'} 1`
            : expr(r.end);
          const start = expr(r.start);
          const range = r.step === 1 ? (start === '0' ? `range(${end})` : `range(${start}, ${end})`) : `range(${start}, ${end}, ${r.step})`;
          w.line(`for ${r.name} in ${range}:`);
          w.indent(() => blockBody(s.body));
          return;
        }
        if (s.init) stmt(s.init.type === 'VariableDeclaration' ? s.init : { type: 'ExpressionStatement', expression: s.init, loc: s.loc });
        w.line(`while ${s.test ? expr(s.test) : 'True'}:`);
        w.indent(() => {
          blockBody(s.body);
          if (s.update) stmt({ type: 'ExpressionStatement', expression: s.update, loc: s.loc });
        });
        if (hasContinue(s.body)) warn(s, 'continue dentro de un for convertido a while: verifica que se ejecute la actualización');
        return;
      }
      case 'ForOfStatement':
      case 'ForInStatement': {
        const v = s.left.type === 'VariableDeclaration' ? target(s.left.declarations[0].id) : target(s.left);
        w.line(`for ${v} in ${expr(s.right)}:`);
        w.indent(() => blockBody(s.body));
        return;
      }
      case 'SwitchStatement': {
        w.line(`match ${expr(s.discriminant)}:`);
        w.indent(() => {
          let labels: string[] = [];
          for (const c of s.cases) {
            if (!c.consequent.length && c.test) {
              labels.push(expr(c.test));
              continue;
            }
            if (c.test) labels.push(expr(c.test));
            w.line(`case ${c.test ? labels.join(' | ') : '_'}:`);
            labels = [];
            const body = c.consequent.filter((x: N) => x.type !== 'BreakStatement');
            w.indent(() => (body.length ? body.forEach(stmt) : w.line('pass')));
          }
        });
        return;
      }
      case 'BlockStatement':
        s.body.forEach(stmt);
        return;
      case 'ReturnStatement':
        w.line(s.argument ? `return ${expr(s.argument)}` : 'return');
        return;
      case 'BreakStatement':
        w.line('break');
        return;
      case 'ContinueStatement':
        w.line('continue');
        return;
      case 'ThrowStatement':
        w.line(`raise ${s.argument.type === 'NewExpression' ? expr(s.argument) : `Exception(${expr(s.argument)})`}`);
        return;
      case 'TryStatement':
        w.line('try:');
        w.indent(() => blockBody(s.block));
        if (s.handler) {
          w.line(s.handler.param ? `except Exception as ${s.handler.param.name}:` : 'except Exception:');
          w.indent(() => blockBody(s.handler.body));
        }
        if (s.finalizer) {
          w.line('finally:');
          w.indent(() => blockBody(s.finalizer));
        }
        return;
      case 'FunctionDeclaration':
        defn(s.id.name, s);
        return;
      case 'ClassDeclaration':
        cls(s);
        return;
      case 'EmptyStatement':
        return;
      case 'LabeledStatement':
        warn(s, 'las etiquetas no existen en Python');
        stmt(s.body);
        return;
    }
    warn(s, `instrucción no convertible (${s.type})`);
    w.line(`# No convertible: ${src(s)}`);
  };

  const hasContinue = (b: N): boolean => /\bcontinue\b/.test(src(b));

  const blockBody = (s: N) => {
    const before = w.lines.length;
    if (s.type === 'BlockStatement') s.body.forEach(stmt);
    else stmt(s);
    if (w.lines.length === before) w.line('pass');
  };

  const flushPending = () => {
    while (pendingDefs.length) {
      const p = pendingDefs.shift()!;
      defn(p.name, p.f);
    }
  };

  const topLevel = new Set<string>();
  for (const s of ast.body) {
    if (s.type === 'VariableDeclaration') for (const d of s.declarations) if (d.id.type === 'Identifier') topLevel.add(d.id.name);
  }

  /** Variables globales que la función modifica (en Python requieren `global`). */
  const globalWrites = (f: N): string[] => {
    const local = new Set<string>(f.params.flatMap((p: N) => (p.type === 'Identifier' ? [p.name] : p.left?.name ? [p.left.name] : [])));
    const writes = new Set<string>();
    const walk = (x: N) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (x !== f && /Function/.test(x.type)) return;
      if (x.type === 'VariableDeclarator' && x.id.type === 'Identifier') local.add(x.id.name);
      if (x.type === 'AssignmentExpression' && x.left.type === 'Identifier') writes.add(x.left.name);
      if (x.type === 'UpdateExpression' && x.argument.type === 'Identifier') writes.add(x.argument.name);
      for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') walk(x[k]);
    };
    walk(f.body);
    return [...writes].filter((n) => !local.has(n) && topLevel.has(n));
  };

  const defn = (name: string, f: N, isMethod = false, isStatic = false) => {
    const params = f.params.map(param);
    if (isMethod && !isStatic) params.unshift('self');
    if (isStatic) w.line('@staticmethod');
    w.line(`def ${name}(${params.join(', ')}):`);
    const start = w.lines.length;
    w.indent(() => {
      const globals = isMethod ? [] : globalWrites(f);
      if (globals.length) w.line(`global ${globals.join(', ')}`);
      if (f.expression) w.line(`return ${expr(f.body)}`);
      else blockBody(f.body);
    });
    if (pendingDefs.length) {
      // definiciones auxiliares extraídas de expresiones: se insertan antes
      const body = w.lines.splice(start);
      const header = w.lines.pop()!;
      w.indent(flushPending);
      w.lines.push(header, ...body);
    }
    w.line();
  };

  const cls = (c: N) => {
    w.line(`class ${c.id.name}${c.superClass ? `(${expr(c.superClass)})` : ''}:`);
    w.indent(() => {
      const fields = c.body.body.filter((m: N) => m.type === 'PropertyDefinition');
      const statics = fields.filter((m: N) => m.static);
      for (const s of statics) w.line(`${s.key.name} = ${s.value ? expr(s.value) : 'None'}`);
      const instanceFields = fields.filter((m: N) => !m.static);
      let hasCtor = false;
      for (const m of c.body.body) {
        if (m.type !== 'MethodDefinition') continue;
        const name = m.kind === 'constructor' ? '__init__' : m.key.type === 'PrivateIdentifier' ? `_${m.key.name}` : m.key.name;
        if (m.kind === 'constructor') {
          hasCtor = true;
          w.line(`def __init__(self${m.value.params.length ? ', ' + m.value.params.map(param).join(', ') : ''}):`);
          w.indent(() => {
            for (const f of instanceFields) w.line(`self.${f.key.type === 'PrivateIdentifier' ? '_' + f.key.name : f.key.name} = ${f.value ? expr(f.value) : 'None'}`);
            blockBody(m.value.body);
          });
          w.line();
          continue;
        }
        if (m.kind === 'get') w.line('@property');
        if (m.kind === 'set') w.line(`@${name}.setter`);
        defn(name, m.value, true, m.static);
      }
      if (!hasCtor && instanceFields.length) {
        w.line('def __init__(self):');
        w.indent(() => instanceFields.forEach((f: N) => w.line(`self.${f.key.name} = ${f.value ? expr(f.value) : 'None'}`)));
      }
      if (!c.body.body.length) w.line('pass');
    });
    w.line();
  };

  w.line('# Código Python generado por PSJavaScript a partir de JavaScript');
  const headerAt = w.lines.length;
  w.line();
  const main = ast.body.filter((s: N) => !(s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration'));
  for (const s of ast.body) if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') stmt(s);
  const before = w.lines.length;
  for (const s of main) stmt(s);
  if (pendingDefs.length) {
    const tail = w.lines.splice(before);
    flushPending();
    w.lines.push(...tail);
  }
  const header: string[] = [...imports].sort().map((i) => `import ${i}`);
  if (usesNumero) {
    if (header.length) header.push('');
    header.push(
      'def numero(texto):',
      '    # Convierte a número como Number() de JavaScript (entero si no tiene decimales)',
      '    valor = float(texto)',
      '    return int(valor) if valor.is_integer() else valor',
      '',
    );
  }
  if (header.length) w.lines.splice(headerAt, 0, ...header);
  return { code: w.toString(), warnings };
}
