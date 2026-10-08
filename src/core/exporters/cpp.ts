/** Exporta JavaScript a C++ (C++20, tipos inferidos de forma sencilla). */
import { ExportResult, N, SimpleType, Writer, functionHasReturnValue, isStringy, literalType, parse, readOf, str, templateParts } from './common';

const OP: Record<string, string> = { '===': '==', '!==': '!=' };
const MATH: Record<string, string> = {
  sqrt: 'sqrt', floor: 'floor', ceil: 'ceil', trunc: 'trunc', round: 'round', abs: 'abs', pow: 'pow', log: 'log', exp: 'exp',
  sin: 'sin', cos: 'cos', tan: 'tan', max: 'max', min: 'min', log10: 'log10', hypot: 'hypot', atan2: 'atan2',
};

export function toCpp(code: string): ExportResult {
  const ast = parse(code);
  const w = new Writer('    ');
  const warnings: string[] = [];
  const src = (n: N) => code.slice(n.start, n.end).replace(/\s+/g, ' ');
  const warn = (n: N, msg: string) => warnings.push(`Línea ${n.loc.start.line}: ${msg}`);
  const types = new Map<string, SimpleType>();
  const globalNames = new Set<string>();
  const globalDone = new Set<string>();
  let usesRandom = false;

  const cType = (t: SimpleType, init?: N): string => {
    switch (t) {
      case 'int':
        return 'int';
      case 'float':
        return 'double';
      case 'string':
        return 'string';
      case 'bool':
        return 'bool';
      case 'array': {
        const el = init?.elements?.[0];
        const et = el ? literalType(el) : 'float';
        return `vector<${et === 'array' ? 'vector<double>' : cType(et === 'unknown' ? 'float' : et)}>`;
      }
    }
    return 'auto';
  };

  const typeOf = (e: N): SimpleType => {
    const t = literalType(e);
    if (t !== 'unknown') return t;
    if (e?.type === 'Identifier') return types.get(e.name) ?? 'unknown';
    return 'unknown';
  };

  /** Tipo de una variable sin valor inicial según su primera asignación. */
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
    return `to_string(${expr(e)})`;
  };

  const expr = (e: N): string => {
    switch (e.type) {
      case 'Literal':
        if (typeof e.value === 'string') return `string(${str(e.value)})`;
        if (e.value === null) return 'nullptr';
        return String(e.raw);
      case 'Identifier':
        if (e.name === 'undefined') return '{}';
        if (e.name === 'Infinity') return 'INFINITY';
        if (e.name === 'NaN') return 'NAN';
        return e.name;
      case 'ThisExpression':
        return 'this';
      case 'TemplateLiteral':
        return templateParts(e).map((p) => ('text' in p ? `string(${str(p.text)})` : toStr(p.expr))).join(' + ') || 'string("")';
      case 'ArrayExpression':
        return `{${e.elements.map((x: N) => (x ? expr(x) : '0')).join(', ')}}`;
      case 'BinaryExpression': {
        if (e.operator === '**') return `pow(${expr(e.left)}, ${expr(e.right)})`;
        if (e.operator === '%' && (typeOf(e.left) === 'float' || typeOf(e.right) === 'float')) return `fmod(${expr(e.left)}, ${expr(e.right)})`;
        if (e.operator === '+' && (isStringy(e.left) || isStringy(e.right))) return `(${toStr(e.left)} + ${toStr(e.right)})`;
        return `(${expr(e.left)} ${OP[e.operator] ?? e.operator} ${expr(e.right)})`;
      }
      case 'LogicalExpression':
        if (e.operator === '??') return expr(e.left);
        return `(${expr(e.left)} ${e.operator} ${expr(e.right)})`;
      case 'UnaryExpression':
        if (e.operator === 'typeof') {
          warn(e, 'typeof no existe en C++');
          return 'string("?")';
        }
        if (e.operator === '+') return `stod(${expr(e.argument)})`;
        return `${e.operator}${expr(e.argument)}`;
      case 'ConditionalExpression':
        return `(${expr(e.test)} ? ${expr(e.consequent)} : ${expr(e.alternate)})`;
      case 'MemberExpression': {
        if (e.computed) return `${expr(e.object)}[${expr(e.property)}]`;
        const p = e.property.name;
        if (e.object.type === 'Identifier' && e.object.name === 'Math') {
          if (p === 'PI') return 'M_PI';
          if (p === 'E') return 'M_E';
        }
        if (p === 'length') return `${expr(e.object)}.size()`;
        if (e.object.type === 'ThisExpression') return `this->${p}`;
        return `${expr(e.object)}.${p}`;
      }
      case 'CallExpression':
        return call(e);
      case 'AssignmentExpression':
        return `(${expr(e.left)} ${e.operator} ${expr(e.right)})`;
      case 'UpdateExpression':
        return e.prefix ? `${e.operator}${expr(e.argument)}` : `${expr(e.argument)}${e.operator}`;
      case 'ArrowFunctionExpression':
      case 'FunctionExpression': {
        const params = e.params.map((p: N) => `auto ${p.name ?? src(p)}`).join(', ');
        if (e.expression) return `[&](${params}) { return ${expr(e.body)}; }`;
        warn(e, 'función anónima con varias instrucciones: revisa la conversión');
        return `[&](${params}) { /* ${src(e.body).slice(0, 60)} */ }`;
      }
      case 'NewExpression': {
        const name = src(e.callee);
        if (/Error$/.test(name)) return `runtime_error(${e.arguments[0] ? expr(e.arguments[0]) : '""'})`;
        warn(e, `new ${name}: las clases no se convierten automáticamente`);
        return `${name}(${e.arguments.map(expr).join(', ')})`;
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
        if (m === 'random') {
          usesRandom = true;
          return '(rand() / (RAND_MAX + 1.0))';
        }
        if (MATH[m]) return `${MATH[m]}(${args.join(', ')})`;
      }
      const t = expr(c.object);
      switch (m) {
        case 'push':
          return `${t}.push_back(${args[0]})`;
        case 'pop':
          return `${t}.pop_back()`;
        case 'toUpperCase':
          return `aMayusculas(${t})`;
        case 'toLowerCase':
          return `aMinusculas(${t})`;
        case 'substring':
        case 'slice':
          return args.length > 1 ? `${t}.substr(${args[0]}, ${args[1]} - ${args[0]})` : `${t}.substr(${args[0]})`;
        case 'charAt':
          return `string(1, ${t}[${args[0]}])`;
        case 'includes':
          return `(${t}.find(${args[0]}) != string::npos)`;
        case 'indexOf':
          return `(int)${t}.find(${args[0]})`;
        case 'toString':
          return `to_string(${t})`;
        case 'toFixed':
          return `formatear(${t}, ${args[0] ?? 0})`;
      }
      warn(e, `método '${m}' sin equivalente directo`);
      return `${t}.${m}(${args.join(', ')})`;
    }
    if (c.type === 'Identifier') {
      switch (c.name) {
        case 'Number':
        case 'parseFloat':
          return `stod(${args[0]})`;
        case 'parseInt':
          return `stoi(${args[0]})`;
        case 'String':
          return `to_string(${args[0]})`;
      }
    }
    return `${expr(c)}(${args.join(', ')})`;
  };

  const coutArgs = (args: N[]) => {
    const parts: string[] = [];
    args.forEach((a, i) => {
      if (i > 0) parts.push('" "');
      if (a.type === 'TemplateLiteral') for (const p of templateParts(a)) parts.push('text' in p ? str(p.text) : expr(p.expr));
      else if (a.type === 'Literal' && typeof a.value === 'string') parts.push(str(a.value));
      else parts.push(expr(a));
    });
    return parts;
  };

  const declare = (name: string, init: N | null, kind: string) => {
    const r = readOf(init);
    if (r) {
      const t: SimpleType = r.conv === 'string' ? 'string' : r.conv === 'int' ? 'int' : r.conv === 'bool' ? 'bool' : 'float';
      types.set(name, t);
      w.line(`${cType(t)} ${name};`);
      if (r.prompt) w.line(`cout << ${r.prompt.type === 'Literal' ? str(String(r.prompt.value)) : expr(r.prompt)} << " ";`);
      if (t === 'string') w.line(`getline(cin >> ws, ${name});`);
      else if (t === 'bool') {
        w.line(`{ string _r; cin >> _r; ${name} = (_r == "s" || _r == "si"); }`);
      } else w.line(`cin >> ${name};`);
      return;
    }
    // En JavaScript todos los números son de punto flotante: se usa double.
    const raw = init ? typeOf(init) : assignedType(name);
    const t: SimpleType = raw === 'int' ? 'float' : raw;
    types.set(name, t);
    // const en JS no impide modificar el contenido de arreglos: solo se respeta en valores simples.
    const prefix = kind === 'const' && t !== 'array' && t !== 'object' && t !== 'unknown' ? 'const ' : '';
    if (!init) w.line(t === 'unknown' ? `double ${name} = 0; // tipo no determinado` : `${cType(t)} ${name}${t === 'string' ? '' : '{}'};`);
    else if (t === 'array') w.line(`${prefix}${cType(t, init)} ${name} = ${expr(init)};`);
    else w.line(`${prefix}${cType(t)} ${name} = ${expr(init)};`);
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
          if (d.init && /FunctionExpression|ArrowFunctionExpression/.test(d.init.type)) {
            w.line(`auto ${d.id.name} = ${expr(d.init)};`);
            continue;
          }
          if (globalDone.has(d.id.name)) continue;
          if (globalNames.has(d.id.name)) {
            // ya declarada como global: solo se asigna/lee aquí
            const r = readOf(d.init);
            if (r) {
              if (r.prompt) w.line(`cout << ${expr(r.prompt)} << " ";`);
              w.line(r.conv === 'string' ? `getline(cin >> ws, ${d.id.name});` : `cin >> ${d.id.name};`);
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
            const stream = /warn|error/.test(callee) ? 'cerr' : 'cout';
            w.line(`${stream} << ${[...coutArgs(e.arguments), 'endl'].join(' << ')};`);
            return;
          }
        }
        if (e.type === 'AssignmentExpression' && e.operator === '=' && e.left.type === 'Identifier') {
          const r = readOf(e.right);
          if (r) {
            if (r.prompt) w.line(`cout << ${expr(r.prompt)} << " ";`);
            w.line(r.conv === 'string' ? `getline(cin >> ws, ${e.left.name});` : `cin >> ${e.left.name};`);
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
              return `${cType(t === 'unknown' ? 'int' : t)} ${d.id.name} = ${d.init ? expr(d.init) : 0}`;
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
        w.line(`for (auto ${v} : ${expr(s.right)}) {`);
        w.indent(() => body(s.body));
        w.line('}');
        return;
      }
      case 'SwitchStatement': {
        const dt = typeOf(s.discriminant);
        w.line(`switch (${dt === 'int' || dt === 'string' ? expr(s.discriminant) : `(int)${expr(s.discriminant)}`}) {`);
        w.indent(() => {
          for (const c of s.cases) {
            w.line(c.test ? `case ${expr(c.test)}:` : 'default:');
            w.indent(() => c.consequent.forEach(stmt));
          }
        });
        w.line('}');
        if (s.cases.some((c: N) => c.test && typeof c.test.value === 'string')) warn(s, 'switch con textos no es válido en C++: conviértelo a if/else');
        return;
      }
      case 'BlockStatement':
        w.line('{');
        w.indent(() => s.body.forEach(stmt));
        w.line('}');
        return;
      case 'ReturnStatement': {
        const a = s.argument;
        const isIntLit = a?.type === 'Literal' && typeof a.value === 'number' && Number.isInteger(a.value) && !/[.eE]/.test(a.raw);
        w.line(a ? `return ${isIntLit ? `${a.raw}.0` : expr(a)};` : 'return;');
        return;
      }
      case 'ReturnStatement_':
        return;
      case 'BreakStatement':
        w.line('break;');
        return;
      case 'ContinueStatement':
        w.line('continue;');
        return;
      case 'ThrowStatement':
        w.line(`throw ${s.argument.type === 'NewExpression' ? expr(s.argument) : `runtime_error(${toStr(s.argument)})`};`);
        return;
      case 'TryStatement':
        w.line('try {');
        w.indent(() => body(s.block));
        w.line(`} catch (exception& ${s.handler?.param?.name ?? 'e'}) {`);
        if (s.handler) w.indent(() => body(s.handler.body));
        w.line('}');
        if (s.finalizer) {
          w.line('// finally');
          body(s.finalizer);
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
    // Tipo de retorno según los valores literales devueltos (todas las ramas deben coincidir en C++).
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
          ? 'string'
          : lits.length && lits.every((t) => t === 'bool')
            ? 'bool'
            : 'auto';
    const params = f.params.map((p: N) => `auto ${p.type === 'Identifier' ? p.name : p.type === 'AssignmentPattern' ? `${p.left.name} = ${expr(p.right)}` : src(p)}`).join(', ');
    w.line(`${ret} ${name}(${params}) {`);
    w.indent(() => (f.expression ? w.line(`return ${expr(f.body)};`) : f.body.body.forEach(stmt)));
    w.line('}');
    w.line();
  };

  const fnWriter = w;
  // Variables del programa principal usadas dentro de funciones → globales
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
        declare(d.id.name, d.init, s.kind);
        globalDone.add(d.id.name);
      } else {
        const r = readOf(d.init);
        const t: SimpleType = r ? (r.conv === 'string' ? 'string' : r.conv === 'bool' ? 'bool' : 'float') : d.init ? 'float' : assignedType(d.id.name);
        types.set(d.id.name, t);
        w.line(`${cType(t === 'unknown' || t === 'int' ? 'float' : t)} ${d.id.name};`);
      }
    }
  }
  if (globalNames.size) w.line();
  // funciones primero
  for (const s of ast.body) {
    if (s.type === 'FunctionDeclaration') fn(s.id.name, s);
    if (s.type === 'ClassDeclaration') {
      warn(s, `class ${s.id.name}: las clases no se convierten automáticamente a C++`);
      w.line(`// class ${s.id.name}: conviértela manualmente`);
    }
  }
  const fnText = fnWriter.lines.slice();
  fnWriter.lines = [];
  fnWriter.level = 1;
  for (const s of ast.body) stmt(s);
  const mainBody = fnWriter.lines.slice();

  const usesStrUtil = mainBody.concat(fnText).some((l) => /aMayusculas|aMinusculas|formatear/.test(l));
  const out: string[] = [
    '// Código C++ generado por PSJavaScript a partir de JavaScript',
    '// Compilar con: g++ -std=c++20 programa.cpp -o programa',
    '#include <iostream>',
    '#include <string>',
    '#include <vector>',
    '#include <cmath>',
    '#include <stdexcept>',
    ...(usesRandom ? ['#include <cstdlib>', '#include <ctime>'] : []),
    ...(usesStrUtil ? ['#include <algorithm>', '#include <sstream>', '#include <iomanip>'] : []),
    'using namespace std;',
    '',
    '// Permite mostrar arreglos con cout, como console.log',
    'template <typename T>',
    'ostream& operator<<(ostream& os, const vector<T>& v) {',
    '    os << "[ ";',
    '    for (size_t i = 0; i < v.size(); i++) os << (i ? ", " : "") << v[i];',
    '    return os << " ]";',
    '}',
    '',
  ];
  if (usesStrUtil) {
    out.push(
      'string aMayusculas(string s) { transform(s.begin(), s.end(), s.begin(), ::toupper); return s; }',
      'string aMinusculas(string s) { transform(s.begin(), s.end(), s.begin(), ::tolower); return s; }',
      'string formatear(double v, int d) { ostringstream o; o << fixed << setprecision(d) << v; return o.str(); }',
      '',
    );
  }
  out.push(...fnText, 'int main() {', ...(usesRandom ? ['    srand(time(nullptr));'] : []), ...mainBody, '    return 0;', '}');
  return { code: out.join('\n').replace(/\n{3,}/g, '\n\n') + '\n', warnings };
}
