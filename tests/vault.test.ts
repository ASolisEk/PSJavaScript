import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVault, decryptText, deriveKey, encryptText, fromBase64, isEncrypted, openVault, toBase64, utf8Decode, utf8Encode } from '../src/core/vault';

test('vault: texto y base64 de ida y vuelta (acentos, ñ, emoji)', () => {
  const s = 'Examen «Parcial 2»: ¿qué imprime? ñandú 😀 \n\t"ok"';
  assert.equal(utf8Decode(utf8Encode(s)), s);
  assert.deepEqual(utf8Encode(s), new Uint8Array(Buffer.from(s, 'utf8')));
  for (let n = 0; n < 40; n++) {
    const b = Uint8Array.from({ length: n }, (_, i) => (i * 37 + n) & 255);
    assert.equal(toBase64(b), Buffer.from(b).toString('base64'));
    assert.deepEqual(fromBase64(toBase64(b)), b);
  }
});

test('vault: la clave de WebCrypto y la de JavaScript puro son la misma (PBKDF2-SHA256)', async () => {
  const salt = Uint8Array.from({ length: 16 }, (_, i) => i);
  const web = await deriveKey('secreto', salt, 1000);
  const subtle = (globalThis as any).crypto.subtle;
  Object.defineProperty((globalThis as any).crypto, 'subtle', { value: undefined, configurable: true });
  try {
    const js = await deriveKey('secreto', salt, 1000);
    assert.deepEqual(js, web);
  } finally {
    Object.defineProperty((globalThis as any).crypto, 'subtle', { value: subtle, configurable: true });
  }
});

test('vault: solo la contraseña correcta abre los datos', async () => {
  const { key, meta } = await createVault('maestra-2026', undefined, 2000);
  const data = JSON.stringify({ title: 'Parcial 2', answer: 'const' });
  const sealed = encryptText(key, data);
  assert.ok(isEncrypted(sealed));
  assert.ok(!sealed.includes('Parcial'));
  // cada cifrado usa un nonce distinto
  assert.notEqual(encryptText(key, data), sealed);
  assert.equal(decryptText(key, sealed), data);

  assert.equal(await openVault('otra', meta), null);
  const again = await openVault('maestra-2026', meta);
  assert.ok(again);
  assert.equal(decryptText(again!, sealed), data);

  // un dato alterado no se descifra
  const tampered = sealed.slice(0, -4) + (sealed.endsWith('AAAA') ? 'BBBB' : 'AAAA');
  assert.throws(() => decryptText(key, tampered));
});
