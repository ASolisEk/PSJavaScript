/** Exporta JavaScript a Java. */
import { ExportResult, N, SimpleType, Writer, functionHasReturnValue, isStringy, literalType, parse, readOf, str, templateParts } from './common';

const OP: Record<string, string> = { '===': '==', '!==': '!=' };
const MATH: Record<string, string> = {
  sqrt: 'sqrt', floor: 'floor', ceil: 'ceil', round: 'round', abs: 'abs', pow: 'pow', log: 'log', exp: 'exp',
  sin: 'sin', cos: 'cos', tan: 'tan', max: 'max', min: 'min', log10: 'log10', asin: 'asin', acos: 'acos', atan: 'atan', atan2: 'atan2'
};

export function toJava(code: string, programName: string = 'Programa'): ExportResult {
  const ast = parse(code);
  const w = new Writer('    ');
  const warnings: string[] = [];
  const src = (n: N) => code.slice(n.start, n.end).replace(/\s+/g, ' ');
  const warn = (n: N, msg: string) => warnings.push(`Línea ${n.loc.start.line}: ${msg}`);
  const types = new Map<string, SimpleType>();
  const globalNames = new Set<string>();
  const globalDone = new Set<string>();
  
  let usesScanner = false;
  let usesMath = false;
  
  // Convertimos el nombre del programa para que sea un identificador válido
  const className = programName.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([0-9])/, '_$1') || 'Main';

  const jType = (t: SimpleType, init?: N): string => {
    switch (t) {
      case 'int': return 'int';
      case 'float': return 'double';
      case 'string': return 'String';
      case 'bool': return 'boolean';
      case 'array': {
        const el = init?.elements?.[0];
        const et = el ? literalType(el) : 'float';
        return `ArrayList<${et === 'array' ? 'ArrayList<Double>' : et === 'string' ? 'String' : et === 'bool' ? 'Boolean' : et === 'int' ? 'Integer' : 'Double'}>`;
      }
    }
    return 'Object'; // Fallback
  };

  const typeOf = (e: N): SimpleType => {
    const t = literalType(e);
    if (t !== 'unknown') return t;
    if (e?.type === 'Identifier') return types.get(e.name) ?? 'unknown';
    return 'unknown';
  };

  const assignedType = (name: string): SimpleType => {
    let found: SimpleType = 'unknown';
    const walk = (x: N) => {
      if (found !== 'unknown' || !x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (x.type === 'AssignmentExpression' && x.operator === '=' && x.left.type === 'Identifier' && x.left.name === name) {
        const t = typeOf(x.right);
        if (t !== 'unknown') found = t;
      }
      for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') walk(x[k]);
    };
    walk(ast.body);
    return found;
  };

  const toStr = (e: N): string => {
    if (isStringy(e) || typeOf(e) === 'string') return expr(e);
    return `String.valueOf(${expr(e)})`;
  };

  const expr = (e: N): string => {
    switch (e.type) {
      case 'Literal':
        if (typeof e.value === 'string') return `"${e.value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\\n/g, '\\\\n')}"`;
        if (e.value === null) return 'null';
        return String(e.raw);
      case 'Identifier':
        if (e.name === 'undefined') return 'null';
        if (e.name === 'Infinity') return 'Double.POSITIVE_INFINITY';
        if (e.name === 'NaN') return 'Double.NaN';
        return e.name;
      case 'ThisExpression':
        return 'this';
      case 'TemplateLiteral':
        return templateParts(e).map((p) => ('text' in p ? `"${p.text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\\n/g, '\\\\n')}"` : toStr(p.expr))).join(' + ') || '""';
      case 'ArrayExpression':
        return `new ArrayList<>(Arrays.asList(${e.elements.map((x: N) => (x ? expr(x) : '0.0')).join(', ')}))`;
      case 'BinaryExpression': {
        const lType = typeOf(e.left);
        const rType = typeOf(e.right);
        
        if ((e.operator === '===' || e.operator === '==' || e.operator === '!==' || e.operator === '!=') && 
            (lType === 'string' || rType === 'string')) {
          const eq = `${expr(e.left)}.equals(${expr(e.right)})`;
          return e.operator.includes('!') ? `(!${eq})` : eq;
        }
        
        if (e.operator === '**') {
            usesMath = true;
            return `Math.pow(${expr(e.left)}, ${expr(e.right)})`;
        }
        if (e.operator === '+' && (isStringy(e.left) || isStringy(e.right))) return `(${toStr(e.left)} + ${toStr(e.right)})`;
        return `(${expr(e.left)} ${OP[e.operator] ?? e.operator} ${expr(e.right)})`;
      }
      case 'LogicalExpression':
        if (e.operator === '??') {
            const l = expr(e.left);
            return `(${l} != null ? ${l} : ${expr(e.right)})`;
        }
        return `(${expr(e.left)} ${e.operator} ${expr(e.right)})`;
      case 'UnaryExpression':
        if (e.operator === 'typeof') {
          warn(e, 'typeof no existe directamente en Java');
          return '"?"';
        }
        if (e.operator === '+') return `Double.parseDouble(String.valueOf(${expr(e.argument)}))`;
        return `${e.operator}${expr(e.argument)}`;
      case 'ConditionalExpression':
        return `(${expr(e.test)} ? ${expr(e.consequent)} : ${expr(e.alternate)})`;
      case 'MemberExpression': {
        if (e.computed) {
            const oType = typeOf(e.object);
            if (oType === 'string') return `String.valueOf(${expr(e.object)}.charAt((int)(${expr(e.property)})))`;
            if (oType === 'array') return `${expr(e.object)}.get((int)(${expr(e.property)}))`;
            return `${expr(e.object)}[${expr(e.property)}]`;
        }
        const p = e.property.name;
        if (e.object.type === 'Identifier' && e.object.name === 'Math') {
          usesMath = true;
          if (p === 'PI') return 'Math.PI';
          if (p === 'E') return 'Math.E';
        }
        if (p === 'length') {
            if (typeOf(e.object) === 'string') return `${expr(e.object)}.length()`;
            if (typeOf(e.object) === 'array') return `${expr(e.object)}.size()`;
            return `${expr(e.object)}.length`;
        }
        if (e.object.type === 'ThisExpression') return `this.${p}`;
        return `${expr(e.object)}.${p}`;
      }
      case 'CallExpression':
        return call(e);
      case 'AssignmentExpression':
        if (e.left.type === 'MemberExpression' && e.left.computed && typeOf(e.left.object) === 'array') {
            return `${expr(e.left.object)}.set((int)(${expr(e.left.property)}), ${expr(e.right)})`;
        }
        return `(${expr(e.left)} ${e.operator} ${expr(e.right)})`;
      case 'UpdateExpression':
        return e.prefix ? `${e.operator}${expr(e.argument)}` : `${expr(e.argument)}${e.operator}`;
      case 'ArrowFunctionExpression':
      case 'FunctionExpression': {
        warn(e, 'funciones anónimas convertidas como lambdas genéricas');
        const params = e.params.map((p: N) => `${p.name ?? src(p)}`).join(', ');
        if (e.expression) return `(${params}) -> ${expr(e.body)}`;
        return `(${params}) -> { /* ${src(e.body).slice(0, 40)}... */ }`;
      }
      case 'NewExpression': {
        const name = src(e.callee);
        if (/Error$/.test(name)) return `new RuntimeException(${e.arguments[0] ? expr(e.arguments[0]) : '""'})`;
        return `new ${name}(${e.arguments.map(expr).join(', ')})`;
      }
      case 'ChainExpression':
        return expr(e.expression);
    }
    warn(e, `expresión no convertible: ${src(e)}`);
    return `/* ${src(e)} */`;
  };

  const call = (e: N): string => {
    const c = e.callee;
    const args = e.arguments.map((a: N) => expr(a));
    if (c.type === 'MemberExpression' && !c.computed) {
      const m = c.property.name;
      if (c.object.type === 'Identifier' && c.object.name === 'Math') {
        usesMath = true;
        if (m === 'random') return 'Math.random()';
        if (m === 'trunc') return `((double)((int)(${args[0]})))`;
        if (MATH[m]) return `Math.${MATH[m]}(${args.join(', ')})`;
      }
      const t = expr(c.object);
      switch (m) {
        case 'push':
          return `${t}.add(${args[0]})`;
        case 'pop':
          return `${t}.remove(${t}.size() - 1)`;
        case 'toUpperCase':
          return `${t}.toUpperCase()`;
        case 'toLowerCase':
          return `${t}.toLowerCase()`;
        case 'substring':
        case 'slice':
          return args.length > 1 ? `${t}.substring((int)(${args[0]}), (int)(${args[1]}))` : `${t}.substring((int)(${args[0]}))`;
        case 'charAt':
          return `String.valueOf(${t}.charAt((int)(${args[0]})))`;
        case 'includes':
          return `${t}.contains(${args[0]})`;
        case 'indexOf':
          return `${t}.indexOf(${args[0]})`;
        case 'toString':
          return `String.valueOf(${t})`;
        case 'toFixed':
          return `String.format("%." + (int)(${args[0] ?? 0}) + "f", ${t})`;
        case 'replace':
        case 'replaceAll':
          return `${t}.replace(${args[0]}, ${args[1]})`;
        case 'trim':
          return `${t}.trim()`;
      }
      warn(e, `método '${m}' sin equivalente directo`);
      return `${t}.${m}(${args.join(', ')})`;
    }
    if (c.type === 'Identifier') {
      switch (c.name) {
        case 'Number':
        case 'parseFloat':
          return `Double.parseDouble(${args[0]})`;
        case 'parseInt':
          return `Integer.parseInt(${args[0]})`;
        case 'String':
          return `String.valueOf(${args[0]})`;
      }
    }
    return `${expr(c)}(${args.join(', ')})`;
  };

  const declare = (name: string, init: N | null, kind: string) => {
    const r = readOf(init);
    if (r) {
      usesScanner = true;
      const t: SimpleType = r.conv === 'string' ? 'string' : r.conv === 'int' ? 'int' : r.conv === 'bool' ? 'bool' : 'float';
      types.set(name, t);
      w.line(`${jType(t)} ${name};`);
      if (r.prompt) w.line(`System.out.print(${r.prompt.type === 'Literal' ? str(String(r.prompt.value)) : expr(r.prompt)} + " ");`);
      if (t === 'string') w.line(`${name} = scanner.nextLine();`);
      else if (t === 'int') w.line(`${name} = scanner.nextInt(); scanner.nextLine();`);
      else if (t === 'bool') w.line(`${name} = scanner.nextLine().toLowerCase().startsWith("s");`);
      else w.line(`${name} = scanner.nextDouble(); scanner.nextLine();`);
      return;
    }
    const raw = init ? typeOf(init) : assignedType(name);
    const t: SimpleType = raw === 'int' ? 'float' : raw; // Default a double numérico en Java
    types.set(name, t);
    
    const modifier = kind === 'const' && t !== 'array' ? 'final ' : '';
    if (!init) w.line(t === 'unknown' ? `double ${name} = 0; // tipo no determinado` : `${jType(t)} ${name};`);
    else w.line(`${modifier}${jType(t, init)} ${name} = ${expr(init)};`);
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
          if (globalDone.has(d.id.name)) continue;
          if (globalNames.has(d.id.name)) {
            const r = readOf(d.init);
            if (r) {
              usesScanner = true;
              if (r.prompt) w.line(`System.out.print(${expr(r.prompt)} + " ");`);
              const conv = r.conv;
              if (conv === 'string') w.line(`${d.id.name} = scanner.nextLine();`);
              else if (conv === 'int') w.line(`${d.id.name} = scanner.nextInt(); scanner.nextLine();`);
              else if (conv === 'bool') w.line(`${d.id.name} = scanner.nextLine().toLowerCase().startsWith("s");`);
              else w.line(`${d.id.name} = scanner.nextDouble(); scanner.nextLine();`);
            } else if (d.init) w.line(`${d.id.name} = ${expr(d.init)};`);
            continue;
          }
          declare(d.id.name, d.init, s.kind);
        }
        return;
      case 'ExpressionStatement': {
        const e = s.expression;
        if (e.type === 'CallExpression') {
          const callee = src(e.callee);
          if (/^console\.(log|info|warn|error)$/.test(callee) || callee === 'alert') {
            const stream = /warn|error/.test(callee) ? 'System.err' : 'System.out';
            if (e.arguments.length === 0) w.line(`${stream}.println();`);
            else if (e.arguments.length === 1) w.line(`${stream}.println(${expr(e.arguments[0])});`);
            else {
                w.line(`${stream}.println(${e.arguments.map(expr).join(' + " " + ')});`);
            }
            return;
          }
        }
        if (e.type === 'AssignmentExpression' && e.operator === '=' && e.left.type === 'Identifier') {
          const r = readOf(e.right);
          if (r) {
            usesScanner = true;
            if (r.prompt) w.line(`System.out.print(${expr(r.prompt)} + " ");`);
            const conv = r.conv;
            if (conv === 'string') w.line(`${e.left.name} = scanner.nextLine();`);
            else if (conv === 'int') w.line(`${e.left.name} = scanner.nextInt(); scanner.nextLine();`);
            else if (conv === 'bool') w.line(`${e.left.name} = scanner.nextLine().toLowerCase().startsWith("s");`);
            else w.line(`${e.left.name} = scanner.nextDouble(); scanner.nextLine();`);
            return;
          }
        }
        w.line(`${expr(e).replace(/^\((.*)\)$/, '$1')};`);
        return;
      }
      case 'IfStatement':
        w.line(`if (${expr(s.test).replace(/^\((.*)\)$/, '$1')}) {`);
        w.indent(() => body(s.consequent));
        if (s.alternate) {
          if (s.alternate.type === 'IfStatement') {
            w.line('} else');
            stmt(s.alternate);
            return;
          }
          w.line('} else {');
          w.indent(() => body(s.alternate));
        }
        w.line('}');
        return;
      case 'WhileStatement':
        w.line(`while (${expr(s.test).replace(/^\((.*)\)$/, '$1')}) {`);
        w.indent(() => body(s.body));
        w.line('}');
        return;
      case 'DoWhileStatement':
        w.line('do {');
        w.indent(() => body(s.body));
        w.line(`} while (${expr(s.test).replace(/^\((.*)\)$/, '$1')});`);
        return;
      case 'ForStatement': {
        let init = '';
        if (s.init?.type === 'VariableDeclaration') {
          init = s.init.declarations
            .map((d: N) => {
              const t = typeOf(d.init);
              types.set(d.id.name, t);
              return `${jType(t === 'unknown' ? 'int' : t)} ${d.id.name} = ${d.init ? expr(d.init) : 0}`;
            })
            .join(', ');
        } else if (s.init) init = expr(s.init);
        w.line(`for (${init}; ${s.test ? expr(s.test).replace(/^\((.*)\)$/, '$1') : ''}; ${s.update ? expr(s.update).replace(/^\((.*)\)$/, '$1') : ''}) {`);
        w.indent(() => body(s.body));
        w.line('}');
        return;
      }
      case 'ForOfStatement': {
        const v = s.left.type === 'VariableDeclaration' ? src(s.left.declarations[0].id) : src(s.left);
        w.line(`for (var ${v} : ${expr(s.right)}) {`);
        w.indent(() => body(s.body));
        w.line('}');
        return;
      }
      case 'SwitchStatement': {
        w.line(`switch (${expr(s.discriminant)}) {`);
        w.indent(() => {
          for (const c of s.cases) {
            w.line(c.test ? `case ${expr(c.test)}:` : 'default:');
            w.indent(() => c.consequent.forEach(stmt));
          }
        });
        w.line('}');
        return;
      }
      case 'BlockStatement':
        w.line('{');
        w.indent(() => s.body.forEach(stmt));
        w.line('}');
        return;
      case 'ReturnStatement':
        w.line(s.argument ? `return ${expr(s.argument)};` : 'return;');
        return;
      case 'BreakStatement':
        w.line('break;');
        return;
      case 'ContinueStatement':
        w.line('continue;');
        return;
      case 'ThrowStatement':
        w.line(`throw ${s.argument.type === 'NewExpression' ? expr(s.argument) : `new RuntimeException(${toStr(s.argument)})`};`);
        return;
      case 'TryStatement':
        w.line('try {');
        w.indent(() => body(s.block));
        w.line(`} catch (Exception ${s.handler?.param?.name ?? 'e'}) {`);
        if (s.handler) w.indent(() => body(s.handler.body));
        w.line('}');
        if (s.finalizer) {
          w.line('finally {');
          w.indent(() => body(s.finalizer));
          w.line('}');
        }
        return;
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
      case 'EmptyStatement':
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
    const lits: SimpleType[] = [];
    const walk = (x: N) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) return x.forEach(walk);
      if (x !== f && /Function/.test(x.type)) return;
      if (x.type === 'ReturnStatement' && x.argument) lits.push(literalType(x.argument));
      for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') walk(x[k]);
    };
    walk(f.body);
    const ret = !functionHasReturnValue(f)
      ? 'void'
      : lits.some((t) => t === 'int' || t === 'float')
        ? 'double'
        : lits.includes('string')
          ? 'String'
          : lits.length && lits.every((t) => t === 'bool')
            ? 'boolean'
            : 'Object';
            
    const params = f.params.map((p: N) => {
        const n = p.type === 'Identifier' ? p.name : p.type === 'AssignmentPattern' ? p.left.name : src(p);
        // Intentar inferir tipo de parámetro basado en su uso (simplificado, asume double)
        return `double ${n}`; 
    }).join(', ');
    
    w.line(`public static ${ret} ${name}(${params}) {`);
    w.indent(() => (f.expression ? w.line(`return ${expr(f.body)};`) : f.body.body.forEach(stmt)));
    w.line('}');
    w.line();
  };

  const fnWriter = w;
  const fnRefs = new Set<string>();
  const collectRefs = (x: N) => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(collectRefs);
    if (x.type === 'Identifier') fnRefs.add(x.name);
    for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') collectRefs(x[k]);
  };
  for (const s of ast.body) if (s.type === 'FunctionDeclaration') collectRefs(s.body);
  
  for (const s of ast.body) {
    if (s.type !== 'VariableDeclaration') continue;
    for (const d of s.declarations) {
      if (d.id.type !== 'Identifier' || !fnRefs.has(d.id.name)) continue;
      if (d.init && /Function/.test(d.init.type)) continue;
      globalNames.add(d.id.name);
      const simple = d.init && !readOf(d.init) && ['int', 'float', 'string', 'bool', 'array'].includes(literalType(d.init));
      if (simple) {
        // En Java declararemos variables globales como estáticas
        globalDone.add(d.id.name);
      } else {
        const r = readOf(d.init);
        const t: SimpleType = r ? (r.conv === 'string' ? 'string' : r.conv === 'bool' ? 'bool' : 'float') : d.init ? 'float' : assignedType(d.id.name);
        types.set(d.id.name, t);
      }
    }
  }

  // Funciones y métodos estáticos
  for (const s of ast.body) {
    if (s.type === 'FunctionDeclaration') fn(s.id.name, s);
    if (s.type === 'ClassDeclaration') {
      warn(s, `class ${s.id.name}: las clases no se convierten automáticamente a Java`);
      w.line(`// class ${s.id.name}: conviértela manualmente`);
    }
  }
  
  const fnText = fnWriter.lines.slice();
  fnWriter.lines = [];
  fnWriter.level = 2; // main() estará indentado 2 veces
  
  // Guardamos las referencias al scanner
  for (const s of ast.body) {
      stmt(s);
  }
  
  const mainBody = fnWriter.lines.slice();

  const out: string[] = [
    '// Código Java generado por PSJavaScript a partir de JavaScript',
    'import java.util.*;',
    ...(usesMath ? ['import java.lang.Math;'] : []),
    '',
    `public class ${className} {`,
  ];
  
  // Escribir variables globales estáticas
  for (const name of globalNames) {
      if (globalDone.has(name)) {
           const t = types.get(name) || 'float';
           out.push(`    static ${jType(t)} ${name};`);
      } else {
           const t = types.get(name) || 'float';
           out.push(`    static ${jType(t)} ${name};`);
      }
  }
  
  if (globalNames.size > 0) out.push('');
  
  // Agregar funciones
  out.push(...fnText.map(line => `    ${line}`.trimEnd()));
  
  // Agregar main
  out.push('    public static void main(String[] args) {');
  if (usesScanner) {
      out.push('        Scanner scanner = new Scanner(System.in);');
      out.push('        scanner.useLocale(Locale.US); // Para leer decimales con punto');
  }
  
  out.push(...mainBody);
  
  if (usesScanner) {
      out.push('        scanner.close();');
  }
  out.push('    }');
  out.push('}');
  
  return { code: out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n', warnings };
}
