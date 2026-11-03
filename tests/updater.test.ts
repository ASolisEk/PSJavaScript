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

test('updater: sin instalador en la release se usa el publicado en main', async () => {
  const { mainBinary } = await import('../src/core/updater');
  const apk = mainBinary('android', '1.0.4')!;
  assert.equal(apk.assetName, 'PSJavaScript.apk');
  assert.ok(apk.downloadUrl.startsWith('https://raw.githubusercontent.com/ASolisEk/PSJavaScript/main/public/PSJavaScript.apk?v='));
  assert.equal(mainBinary('electron-win')!.assetName, 'PSJavaScript-Setup.exe');
  assert.equal(mainBinary('electron-mac')!.assetName, 'PSJavaScript.dmg');
  assert.equal(mainBinary('electron-linux')!.assetName, 'PSJavaScript.AppImage');
  assert.equal(mainBinary('web'), null);
});
