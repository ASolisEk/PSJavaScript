import assert from 'node:assert/strict';
import test from 'node:test';
import { isNewerVersion, findBestAsset } from '../src/core/updater';

test('updater: comparación semver con isNewerVersion', () => {
  assert.equal(isNewerVersion('1.0.0', '1.0.1'), true);
  assert.equal(isNewerVersion('1.0.0', '1.1.0'), true);
  assert.equal(isNewerVersion('1.0.0', '2.0.0'), true);
  assert.equal(isNewerVersion('1.0.1', '1.0.2'), true);
  assert.equal(isNewerVersion('1.0.1', '1.0.1'), false);
  assert.equal(isNewerVersion('1.0.1', '1.0.0'), false);
  assert.equal(isNewerVersion('1.2.0', '1.1.9'), false);
  assert.equal(isNewerVersion('2.0.0', '1.9.9'), false);
  assert.equal(isNewerVersion('1.0.0', '1.0.0'), false);
});

test('updater: selección de instalador adecuado por plataforma', () => {
  const assets = [
    { name: 'PSJavaScript-1.1.0-Setup.exe', browser_download_url: 'https://github.com/.../Setup.exe', size: 1000 },
    { name: 'PSJavaScript-1.1.0.AppImage', browser_download_url: 'https://github.com/.../AppImage', size: 1000 },
    { name: 'PSJavaScript-1.1.0.dmg', browser_download_url: 'https://github.com/.../dmg', size: 1000 },
    { name: 'PSJavaScript-1.1.0.apk', browser_download_url: 'https://github.com/.../apk', size: 1000 },
  ];

  assert.equal(findBestAsset(assets, 'linux')?.name, 'PSJavaScript-1.1.0.AppImage');
  assert.equal(findBestAsset(assets, 'windows')?.name, 'PSJavaScript-1.1.0-Setup.exe');
  assert.equal(findBestAsset(assets, 'mac')?.name, 'PSJavaScript-1.1.0.dmg');
  assert.equal(findBestAsset(assets, 'android')?.name, 'PSJavaScript-1.1.0.apk');
});

test('updater: sin instalador en la respuesta se usa la descarga directa de la última versión', async () => {
  const { mainBinary } = await import('../src/core/updater');
  const apk = mainBinary('android', '1.0.5')!;
  assert.equal(apk.assetName, 'PSJavaScript.apk');
  assert.equal(apk.downloadUrl, 'https://github.com/ASolisEk/PSJavaScript/releases/latest/download/PSJavaScript.apk');
  assert.equal(mainBinary('electron-win')!.assetName, 'PSJavaScript-Setup.exe');
  assert.equal(mainBinary('electron-mac')!.assetName, 'PSJavaScript.dmg');
  assert.equal(mainBinary('electron-linux')!.assetName, 'PSJavaScript.AppImage');
  assert.equal(mainBinary('web'), null);
});

test('reporte de errores: se guardan pocos, sin repetir, y el enlace lleva la información', async () => {
  const { recordError, recentErrors, issueUrl } = await import('../src/core/errorLog');
  for (let i = 0; i < 30; i++) recordError(new Error(`falla ${i}`), 'prueba');
  recordError(new Error('falla 29'), 'prueba');
  const list = recentErrors();
  assert.equal(list.length, 20);
  assert.equal(list[list.length - 1].message, 'falla 29');
  const url = issueUrl({ what: 'Se cerró el examen', version: '1.0.4', platform: 'Web', errors: list });
  assert.ok(url.startsWith('https://github.com/ASolisEk/PSJavaScript/issues/new?'));
  const body = decodeURIComponent(new URL(url).searchParams.get('body')!);
  assert.ok(body.includes('Se cerró el examen') && body.includes('1.0.4') && body.includes('falla 29'));
});
