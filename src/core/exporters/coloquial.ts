/** Describe el algoritmo en lenguaje coloquial (español), paso a paso. */
import { ExportResult, N, forRange, parse, readOf, templateParts } from './common';

const CMP: Record<string, string> = {
  '===': 'es igual a', '==': 'es igual a', '!==': 'es distinto de', '!=': 'es distinto de',
  '<': 'es menor que', '<=': 'es menor o igual que', '>': 'es mayor que', '>=': 'es mayor o igual que',
};

export function toColoquial(code: string): ExportResult {
  const ast = parse(code);
  const out: string[] = [];
  const src = (n: N) => code.slice(n.start, n.end).replace(/\s+/g, ' ');

  const val = (e: N): string => {
    switch (e.type) {
      case 'Literal':
        if (typeof e.value === 'string') return `"${e.value}"`;
        if (typeof e.value === 'boolean') return e.value ? 'verdadero' : 'falso';
        if (e.value === null) return 'nulo';
        return String(e.raw);
      case 'Identifier':
        return e.name === 'undefined' ? 'indefinido' : e.name;
      case 'TemplateLiteral':
        return templateParts(e).map((p) => ('text' in p ? `"${p.text}"` : val(p.expr))).join(' seguido de ');
      case 'BinaryExpression':
        if (CMP[e.operator]) return `${val(e.left)} ${CMP[e.operator]} ${val(e.right)}`;
        if (e.operator === '%') return `el resto de dividir ${val(e.left)} entre ${val(e.right)}`;
        return src(e);
      case 'LogicalExpression':
        return `${val(e.left)} ${e.operator === '&&' ? 'y' : e.operator === '||' ? 'o' : 'o en su defecto'} ${val(e.right)}`;
      case 'UnaryExpression':
        if (e.operator === '!') return `no se cumple que ${val(e.argument)}`;
        return src(e);
      case 'MemberExpression':
        if (!e.computed && e.property.name === 'length') return `la longitud de ${val(e.object)}`;
        if (e.computed) return `el elemento ${val(e.property)} de ${val(e.object)}`;
        return src(e);
      case 'CallExpression': {
        const r = readOf(e);
        if (r) return 'el dato ingresado por el usuario';
        const c = src(e.callee);
        if (c === 'Math.random') return 'un número aleatorio entre 0 y 1';
        if (c === 'Math.sqrt') return `la raíz cuadrada de ${val(e.arguments[0])}`;
        if (c === 'Math.floor') return `${val(e.arguments[0])} redondeado hacia abajo`;
        if (c === 'Math.round') return `${val(e.arguments[0])} redondeado`;
        if (c === 'Math.abs') return `el valor absoluto de ${val(e.arguments[0])}`;
        if (c === 'Math.max') return `el mayor entre ${e.arguments.map(val).join(', ')}`;
        if (c === 'Math.min') return `el menor entre ${e.arguments.map(val).join(', ')}`;
        if (c === 'Number' || c === 'parseFloat' || c === 'parseInt') return `${val(e.arguments[0])} convertido a número`;
        if (c === 'String') return `${val(e.arguments[0])} convertido a texto`;
        return `el resultado de ${src(e)}`;
      }
      case 'ArrayExpression':
        return e.elements.length ? `la lista [${e.elements.map((x: N) => (x ? val(x) : '')).join(', ')}]` : 'una lista vacía';
      case 'ObjectExpression':
        return 'un objeto con ' + (e.properties.map((p: N) => (p.key ? p.key.name ?? p.key.value : '…')).join(', ') || 'ninguna propiedad');
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return 'una función';
      case 'ConditionalExpression':
        return `${val(e.consequent)} si ${val(e.test)}, o ${val(e.alternate)} en caso contrario`;
    }
    return src(e);
  };

  const emit = (num: string, depth: number, text: string) => out.push(`${'   '.repeat(depth)}${num ? num + ' ' : ''}${text}`);

  const describe = (s: N): string | null => {
    switch (s.type) {
      case 'VariableDeclaration':
        return s.declarations
          .map((d: N) => {
            const name = src(d.id);
            const r = readOf(d.init);
            if (r) return `Pedir al usuario ${r.prompt ? val(r.prompt) : 'un dato'} y guardar la respuesta${r.conv === 'number' || r.conv === 'float' || r.conv === 'int' ? ' (como número)' : ''} en ${name}.`;
            if (d.init && /Function/.test(d.init.type)) return `Definir la función ${name} (ver más abajo).`;
            return d.init ? `Crear ${s.kind === 'const' ? 'la constante' : 'la variable'} ${name} con el valor ${val(d.init)}.` : `Crear la variable ${name} sin valor inicial.`;
          })
          .join(' ');
      case 'ExpressionStatement': {
        const e = s.expression;
        if (e.type === 'CallExpression') {
          const c = src(e.callee);
          if (/^console\.(log|info)$/.test(c) || c === 'alert') return `Mostrar en pantalla ${e.arguments.map(val).join(', ') || 'una línea vacía'}.`;
          if (/^console\.(warn|error)$/.test(c)) return `Mostrar un mensaje de ${c.endsWith('warn') ? 'advertencia' : 'error'}: ${e.arguments.map(val).join(', ')}.`;
          if (e.callee.type === 'MemberExpression' && e.callee.property.name === 'push') return `Agregar ${e.arguments.map(val).join(', ')} al final de ${val(e.callee.object)}.`;
          return `Ejecutar ${src(e)}.`;
        }
        if (e.type === 'AssignmentExpression') {
          const t = src(e.left);
          const r = readOf(e.right);
          if (r) return `Pedir al usuario ${r.prompt ? val(r.prompt) : 'un dato'} y guardarlo en ${t}.`;
          switch (e.operator) {
            case '=':
              return `Asignar a ${t} el valor ${val(e.right)}.`;
            case '+=':
              return `Aumentar ${t} en ${val(e.right)}.`;
            case '-=':
              return `Disminuir ${t} en ${val(e.right)}.`;
            case '*=':
              return `Multiplicar ${t} por ${val(e.right)}.`;
            case '/=':
              return `Dividir ${t} entre ${val(e.right)}.`;
          }
          return `Actualizar ${t}: ${src(e)}.`;
        }
        if (e.type === 'UpdateExpression') return `${e.operator === '++' ? 'Incrementar' : 'Decrementar'} ${src(e.argument)} en 1.`;
        return `Evaluar ${src(e)}.`;
      }
      case 'ReturnStatement':
        return s.argument ? `Devolver ${val(s.argument)} como resultado.` : 'Terminar la función.';
      case 'BreakStatement':
        return 'Salir del ciclo (o del caso actual).';
      case 'ContinueStatement':
        return 'Saltar a la siguiente repetición del ciclo.';
      case 'ThrowStatement':
        return `Lanzar un error: ${s.argument.type === 'NewExpression' && s.argument.arguments[0] ? val(s.argument.arguments[0]) : val(s.argument)}.`;
      case 'ClassDeclaration':
        return `Definir la clase ${s.id.name}${s.superClass ? ` (que hereda de ${src(s.superClass)})` : ''}.`;
    }
    return null;
  };

  const seq = (stmts: N[], prefix: string, depth: number, start = 0) => {
    let i = start;
    for (const s of stmts) {
      if (s.type === 'FunctionDeclaration' || s.type === 'EmptyStatement') continue;
      i++;
      stmtOut(s, `${prefix}${i}.`, depth);
    }
    return i - start;
  };

  const body = (s: N, prefix: string, depth: number, start = 0): number => {
    const stmts = s.type === 'BlockStatement' ? s.body : [s];
    const n = seq(stmts, prefix, depth, start);
    if (!n) {
      emit(`${prefix}${start + 1}.`, depth, 'No hacer nada.');
      return 1;
    }
    return n;
  };

  const stmtOut = (s: N, num: string, depth: number) => {
    const d = describe(s);
    if (d) return emit(num, depth, d);
    switch (s.type) {
      case 'IfStatement':
        emit(num, depth, `Si ${val(s.test)}, entonces:`);
        const k = body(s.consequent, num, depth + 1);
        if (s.alternate) {
          emit('', depth + 1, 'En caso contrario:');
          body(s.alternate, num, depth + 1, k);
        }
        return;
      case 'WhileStatement':
        emit(num, depth, `Mientras ${val(s.test)}, repetir:`);
        body(s.body, num, depth + 1);
        return;
      case 'DoWhileStatement':
        emit(num, depth, 'Repetir lo siguiente:');
        body(s.body, num, depth + 1);
        emit('', depth + 1, `…hasta que deje de cumplirse que ${val(s.test)}.`);
        return;
      case 'ForStatement': {
        const r = forRange(s);
        if (r) {
          const dir = r.step > 0 ? (r.step === 1 ? 'aumentando de 1 en 1' : `aumentando de ${r.step} en ${r.step}`) : r.step === -1 ? 'disminuyendo de 1 en 1' : `disminuyendo de ${-r.step} en ${-r.step}`;
          emit(num, depth, `Repetir para ${r.name} desde ${val(r.start)} hasta ${r.inclusive ? '' : 'antes de '}${val(r.end)} (${dir}):`);
        } else emit(num, depth, `Repetir (${s.init ? src(s.init) + '; ' : ''}mientras ${s.test ? val(s.test) : 'siempre'}${s.update ? '; luego ' + src(s.update) : ''}):`);
        body(s.body, num, depth + 1);
        return;
      }
      case 'ForOfStatement':
      case 'ForInStatement': {
        const v = s.left.type === 'VariableDeclaration' ? src(s.left.declarations[0].id) : src(s.left);
        emit(num, depth, s.type === 'ForOfStatement' ? `Para cada elemento ${v} de ${val(s.right)}, hacer:` : `Para cada clave ${v} de ${val(s.right)}, hacer:`);
        body(s.body, num, depth + 1);
        return;
      }
      case 'SwitchStatement':
        emit(num, depth, `Según el valor de ${val(s.discriminant)}:`);
        s.cases.forEach((c: N, i: number) => {
          emit(`${num}${i + 1}.`, depth + 1, c.test ? `Si es ${val(c.test)}:` : 'En cualquier otro caso:');
          const stmts = c.consequent.filter((x: N) => x.type !== 'BreakStatement');
          if (!seq(stmts, `${num}${i + 1}.`, depth + 2) && c.test) emit('', depth + 2, '(continúa con el siguiente caso)');
        });
        return;
      case 'TryStatement':
        emit(num, depth, 'Intentar lo siguiente:');
        body(s.block, num, depth + 1);
        if (s.handler) {
          emit('', depth + 1, `Si ocurre un error${s.handler.param ? ` (llamado ${src(s.handler.param)})` : ''}:`);
          body(s.handler.body, num, depth + 1);
        }
        if (s.finalizer) {
          emit('', depth + 1, 'En todos los casos, al final:');
          body(s.finalizer, num, depth + 1);
        }
        return;
      case 'BlockStatement':
        body(s, num, depth);
        return;
      case 'LabeledStatement':
        stmtOut(s.body, num, depth);
        return;
    }
    emit(num, depth, `${src(s)}.`);
  };

  out.push('ALGORITMO EN LENGUAJE COLOQUIAL', '');
  out.push('Programa principal:');
  emit('1.', 0, 'Inicio.');
  const n = seq(ast.body, '', 0, 1);
  emit(`${n + 2}.`, 0, 'Fin.');

  const fns: { name: string; f: N }[] = [];
  const collect = (x: N) => {
    if (!x || typeof x !== 'object') return;
    if (Array.isArray(x)) return x.forEach(collect);
    if (x.type === 'FunctionDeclaration') fns.push({ name: x.id.name, f: x });
    else if (x.type === 'VariableDeclarator' && x.init && /Function/.test(x.init.type) && x.id.type === 'Identifier') fns.push({ name: x.id.name, f: x.init });
    else if (x.type === 'MethodDefinition') fns.push({ name: `${x.kind === 'constructor' ? 'constructor' : x.key.name}`, f: x.value });
    for (const k of Object.keys(x)) if (k !== 'loc' && x[k] && typeof x[k] === 'object') collect(x[k]);
  };
  collect(ast.body);
  for (const { name, f } of fns) {
    out.push('', `Función ${name}${f.params.length ? ` (recibe: ${f.params.map(src).join(', ')})` : ''}:`);
    if (f.expression) emit('1.', 0, `Devolver ${val(f.body)} como resultado.`);
    else body(f.body, '', 0);
  }
  return { code: out.join('\n') + '\n', warnings: [] };
}
