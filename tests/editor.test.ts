import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tokenize, tokensByLine, matchBracket, declaredNames } from '../src/core/editor/tokenizer';
import { formatCode, newlineWithIndent, dedentOnClose, toggleComment } from '../src/core/editor/indent';

test('tokenizador reconstruye el texto exacto', () => {
  const code = 'const s = `a${x + {b:1}.b}c`; // hola\nlet r = /a\\/b/g.test(s) / 2;\n/* multi\nlinea */ console.log("x\\"y", 1.5e3, obj.prop());';
  const toks = tokenize(code);
  assert.equal(toks.map((t) => t.text).join(''), code);
  const types = Object.fromEntries(toks.filter((t) => t.type !== 'space').map((t) => [t.text, t.type]));
  assert.equal(types['const'], 'keyword');
  assert.equal(types['// hola'], 'comment');
  assert.equal(types['/a\\/b/g'], 'regex');
  assert.equal(types['console'], 'builtin');
  assert.equal(types['prop'], 'func');
  assert.equal(types['1.5e3'], 'number');
  const lines = tokensByLine(code);
  assert.equal(lines.length, 4);
  assert.equal(lines.map((l) => l.map((t) => t.text).join('')).join('\n'), code);
});

test('pareo de llaves', () => {
  const code = 'if (a) { f([1, 2]); }';
  const toks = tokenize(code);
  assert.deepEqual(matchBracket(toks, 8), [7, 20]);
  assert.deepEqual(matchBracket(toks, 21), [7, 20]);
  assert.deepEqual(matchBracket(toks, 12), [11, 16]);
});

test('formato y sangría', () => {
  const code = 'function f(x) {\nif (x) {\nswitch (x) {\ncase 1:\nreturn 1;\ndefault:\nreturn 2;\n}\n}\nconst s = `a\n  b`;\n}';
  assert.equal(
    formatCode(code),
    'function f(x) {\n  if (x) {\n    switch (x) {\n      case 1:\n        return 1;\n      default:\n        return 2;\n    }\n  }\n  const s = `a\n  b`;\n}',
  );
  const r = newlineWithIndent('if (a) {}', 8);
  assert.equal(r.text, 'if (a) {\n  \n}');
  assert.equal(r.cursor, 11);
  const d = dedentOnClose('if (a) {\n  x;\n  }', 17);
  assert.equal(d!.text, 'if (a) {\n  x;\n}');
  assert.equal(toggleComment('a;\nb;', 0, 4).text, '// a;\n// b;');
  assert.deepEqual(declaredNames('let a = 1; function g(p, q = 2) {} const h = (z) => z;').sort(), ['a', 'g', 'h', 'p', 'q', 'z']);
});
