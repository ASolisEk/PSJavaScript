import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DOWNLOAD_TARGETS, detectTarget, downloadUrl, formatSize, isAvailable, parseRelease, targetById } from '../src/core/downloads';
import { mainBinary } from '../src/core/updater';

test('descargas: instalador recomendado según el equipo', () => {
  assert.equal(detectTarget('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Win32'), 'win');
  assert.equal(detectTarget('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'macOS'), 'mac', 'sin arquitectura, Apple Silicon');
  assert.equal(detectTarget('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'macOS', 'x86'), 'mac-intel');
  assert.equal(detectTarget('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'macOS', 'arm'), 'mac');
  assert.equal(detectTarget('Mozilla/5.0 (X11; Linux x86_64)', 'Linux x86_64'), 'linux');
  assert.equal(detectTarget('Mozilla/5.0 (Linux; Android 14; Pixel 8)', 'Linux armv8l'), 'android');
  assert.equal(detectTarget('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', 'iPhone'), null);
});

test('descargas: datos de la última versión publicada', () => {
  const r = parseRelease({
    tag_name: 'v1.2.0',
    published_at: '2026-11-14T10:00:00Z',
    html_url: 'https://github.com/x/y/releases/tag/v1.2.0',
    body: 'Notas',
    assets: [
      { name: 'PSJavaScript.apk', browser_download_url: 'https://dl/apk', size: 66_000_000, digest: 'sha256:abc123', download_count: 7 },
      { name: 'PSJavaScript-Setup.exe', browser_download_url: 'https://dl/exe', size: 89_000_000 },
      { name: 'roto' },
    ],
  })!;
  assert.equal(r.version, '1.2.0');
  assert.equal(r.assets['PSJavaScript.apk'].sha256, 'abc123');
  assert.equal(Object.keys(r.assets).length, 2);
  assert.equal(downloadUrl(targetById('android'), r), 'https://dl/apk');
  // sin datos de la API: descarga directa de la última versión
  assert.match(downloadUrl(targetById('mac'), null), /releases\/latest\/download\/PSJavaScript\.dmg$/);
  assert.equal(isAvailable(targetById('mac-intel'), r), false);
  assert.equal(isAvailable(targetById('win'), r), true);
  assert.equal(isAvailable(targetById('win'), null), null);
  assert.equal(parseRelease({ message: 'Not Found' }), null);
  assert.equal(formatSize(66_000_000), '62.9 MB');
  assert.equal(new Set(DOWNLOAD_TARGETS.map((d) => d.file)).size, DOWNLOAD_TARGETS.length);
});

test('actualizador: un Mac Intel descarga su propio instalador', () => {
  assert.equal(mainBinary('electron-mac', undefined, 'x64')!.assetName, 'PSJavaScript-Intel.dmg');
  assert.equal(mainBinary('electron-mac', undefined, 'arm64')!.assetName, 'PSJavaScript.dmg');
  assert.equal(mainBinary('electron-win', undefined, 'x64')!.assetName, 'PSJavaScript-Setup.exe');
});
