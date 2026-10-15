#!/usr/bin/env node

/**
 * PSJavaScript - Script de compilación y exportación nativa para Android (Local)
 *
 * Permite compilar y empaquetar de manera 100% local sin depender de servidores en la nube.
 * Soporta generación de APK (instalable directamente), AAB (Google Play Store), Debug APK y exportación estática.
 */

const { spawnSync, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const androidDir = path.join(rootDir, 'android');
const distAndroidDir = path.join(rootDir, 'dist-android');
const appJsonPath = path.join(rootDir, 'app.json');
const packageJsonPath = path.join(rootDir, 'package.json');

const args = process.argv.slice(2);
const isWin = process.platform === 'win32';

// Cargar metadatos
let appConfig = {};
let pkgConfig = {};
try {
  appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8')).expo || {};
} catch (_) {}
try {
  pkgConfig = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
} catch (_) {}

const appName = appConfig.name || pkgConfig.name || 'PSJavaScript';
const appVersion = appConfig.version || pkgConfig.version || '1.0.0';
const appPackage = (appConfig.android && appConfig.android.package) || 'com.psjavascript.app';

// Comprobar ayuda
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
===================================================================
  📱 PSJavaScript - Compilación y Exportación Local para Android
===================================================================

Uso:
  node scripts/build-android.js [opciones]
  npm run build:android [opciones]

Opciones principales:
  --apk               (Por defecto) Compila el APK Release firmado para distribución directa.
  --aab               Compila el Android App Bundle (.aab) para subir a Google Play Store.
  --debug             Compila un APK en modo Debug para pruebas y depuración rápida.
  --install           Instala automáticamente el APK resultante en un teléfono o emulador conectado vía ADB.
  --clean             Ejecuta gradlew clean antes de iniciar la compilación.
  --prebuild          Solo regenera la carpeta nativa android/ sin compilar.
  --export            Exporta los bundles JS Hermes y recursos estáticos con expo export.
  --generate-keystore Asistente para generar un almacén de claves (release.keystore) para producción.
  --help, -h          Muestra este mensaje de ayuda.

Comandos rápidos con npm:
  npm run build:android          -> Genera dist-android/${appName}-${appVersion}-release.apk
  npm run build:android:aab      -> Genera dist-android/${appName}-${appVersion}-release.aab
  npm run build:android:debug    -> Genera dist-android/${appName}-${appVersion}-debug.apk
  npm run build:android:install  -> Compila el APK y lo instala automáticamente vía ADB
  npm run export:android         -> Exporta los bundles Hermes en dist/
===================================================================
`);
  process.exit(0);
}

// Comprobar generador de Keystore
if (args.includes('--generate-keystore')) {
  generateKeystore();
  process.exit(0);
}

// Determinar modo
const buildAab = args.includes('--aab');
const buildDebug = args.includes('--debug');
const doClean = args.includes('--clean');
const doInstall = args.includes('--install');
const onlyPrebuild = args.includes('--prebuild');
const onlyExport = args.includes('--export');

console.log('\n===================================================================');
console.log(`🚀 PSJavaScript - Compilación Local Android [v${appVersion}]`);
console.log(`📦 Paquete: ${appPackage}`);
console.log('===================================================================\n');

// 1. Detectar y validar entorno Java
detectAndSetJava();

// 2. Detectar y validar entorno Android SDK
detectAndSetAndroidSdk();

// 3. Si solo se solicita exportación estática
if (onlyExport) {
  runStaticExport();
  process.exit(0);
}

// 4. Asegurar que existe la carpeta nativa android/
ensureNativePrebuild();

// 5. Si solo se solicitó prebuild, terminar aquí
if (onlyPrebuild) {
  console.log('✅ Prebuild de Android completado exitosamente.');
  process.exit(0);
}

// 6. Asegurar soporte de firma flexible en build.gradle
patchBuildGradleSigning();

// 7. Ejecutar compilación Gradle
const targetType = buildAab ? 'aab' : buildDebug ? 'debug' : 'release';
runGradleBuild(targetType, doClean);

// 8. Copiar y empaquetar el binario final en dist-android/
const finalArtifactPath = processBuildOutput(targetType);

// 9. Instalar en dispositivo si se solicitó
if (doInstall && finalArtifactPath && finalArtifactPath.endsWith('.apk')) {
  installOnAdbDevice(finalArtifactPath);
}

console.log('\n✨ ¡Proceso completado con éxito!\n');

// --- Funciones auxiliares ---

function detectAndSetJava() {
  process.stdout.write('🔍 Verificando Java SDK... ');
  let javaHome = process.env.JAVA_HOME;

  if (!javaHome || !fs.existsSync(javaHome)) {
    const commonMacPaths = [
      '/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home',
      '/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home',
      '/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home',
      '/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home'
    ];
    for (const p of commonMacPaths) {
      if (fs.existsSync(p)) {
        javaHome = p;
        break;
      }
    }
  }

  if (javaHome && fs.existsSync(javaHome)) {
    process.env.JAVA_HOME = javaHome;
    const javaBin = path.join(javaHome, 'bin');
    if (!process.env.PATH.includes(javaBin)) {
      process.env.PATH = `${javaBin}${path.delimiter}${process.env.PATH}`;
    }
    console.log(`OK (${javaHome})`);
  } else {
    try {
      const ver = execSync('java -version 2>&1', { encoding: 'utf8' });
      console.log(`OK (detectado en PATH)`);
    } catch (e) {
      console.error('\n❌ ERROR: No se encontró una instalación válida de Java (se recomienda OpenJDK 17).');
      console.error('Configura la variable de entorno JAVA_HOME o instala Java con: brew install openjdk@17');
      process.exit(1);
    }
  }
}

function detectAndSetAndroidSdk() {
  process.stdout.write('🔍 Verificando Android SDK... ');
  let sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;

  if (!sdk || !fs.existsSync(sdk)) {
    const candidates = [
      '/opt/homebrew/share/android-commandlinetools',
      path.join(process.env.HOME || '', 'Library/Android/sdk'),
      path.join(process.env.HOME || '', 'Android/Sdk'),
      path.join(process.env.LOCALAPPDATA || '', 'Android\\Sdk')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        sdk = c;
        break;
      }
    }
  }

  if (sdk && fs.existsSync(sdk)) {
    process.env.ANDROID_HOME = sdk;
    process.env.ANDROID_SDK_ROOT = sdk;

    // Agregar platform-tools (adb) al PATH si no está
    const platformTools = path.join(sdk, 'platform-tools');
    if (fs.existsSync(platformTools) && !process.env.PATH.includes(platformTools)) {
      process.env.PATH = `${platformTools}${path.delimiter}${process.env.PATH}`;
    }
    console.log(`OK (${sdk})`);
  } else {
    console.error('\n❌ ERROR: No se encontró la ruta del Android SDK.');
    console.error('Configura la variable de entorno ANDROID_HOME apuntando a tu Android SDK.');
    process.exit(1);
  }
}

function ensureNativePrebuild() {
  const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
  if (!fs.existsSync(androidDir) || !fs.existsSync(gradlew)) {
    console.log('⚙️  Generando proyecto nativo Android con Expo Prebuild...');
    const result = spawnSync('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env
    });
    if (result.status !== 0) {
      console.error('❌ Error ejecutando expo prebuild.');
      process.exit(result.status || 1);
    }
  }
  if (!isWin && fs.existsSync(gradlew)) {
    try {
      fs.chmodSync(gradlew, '755');
    } catch (_) {}
  }
}

function patchBuildGradleSigning() {
  const appBuildGradle = path.join(androidDir, 'app', 'build.gradle');
  if (!fs.existsSync(appBuildGradle)) return;

  let content = fs.readFileSync(appBuildGradle, 'utf8');
  if (!content.includes('PSJS_STORE_FILE')) {
    console.log('⚙️  Configurando soporte de firma personalizada en android/app/build.gradle...');
    const target = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;
    const replacement = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            def storeFilePath = findProperty('PSJS_STORE_FILE') ?: System.getenv('PSJS_STORE_FILE') ?: (file('release.keystore').exists() ? 'release.keystore' : null)
            if (storeFilePath && file(storeFilePath).exists()) {
                storeFile file(storeFilePath)
                storePassword findProperty('PSJS_STORE_PASSWORD') ?: System.getenv('PSJS_STORE_PASSWORD') ?: 'android'
                keyAlias findProperty('PSJS_KEY_ALIAS') ?: System.getenv('PSJS_KEY_ALIAS') ?: 'psjavascript'
                keyPassword findProperty('PSJS_KEY_PASSWORD') ?: System.getenv('PSJS_KEY_PASSWORD') ?: 'android'
            } else {
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }
    }`;
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      content = content.replace(/signingConfig signingConfigs\.debug/g, (match, offset) => {
        // Reemplazar solo en bloque release
        const before = content.slice(Math.max(0, offset - 100), offset);
        if (before.includes('release {')) {
          return 'signingConfig signingConfigs.release';
        }
        return match;
      });
      fs.writeFileSync(appBuildGradle, content, 'utf8');
    }
  }
}

function runGradleBuild(targetType, clean) {
  const gradlewCmd = isWin ? 'gradlew.bat' : './gradlew';
  const tasks = [];

  if (clean) {
    tasks.push('clean');
  }

  if (targetType === 'aab') {
    tasks.push('bundleRelease');
  } else if (targetType === 'debug') {
    tasks.push('assembleDebug');
  } else {
    tasks.push('assembleRelease');
  }

  console.log(`\n🔨 Compilando con Gradle [${tasks.join(' ')}]...\n`);
  const startTime = Date.now();

  const result = spawnSync(gradlewCmd, tasks, {
    cwd: androidDir,
    stdio: 'inherit',
    env: process.env
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);

  if (result.status !== 0) {
    console.error(`\n❌ Error durante la compilación de Gradle (código ${result.status}).`);
    process.exit(result.status || 1);
  }

  console.log(`\n⏱️  Compilación completada con éxito en ${durationSec}s`);
}

function processBuildOutput(targetType) {
  if (!fs.existsSync(distAndroidDir)) {
    fs.mkdirSync(distAndroidDir, { recursive: true });
  }

  let sourceFile = null;
  let targetFileName = '';

  if (targetType === 'aab') {
    sourceFile = path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
    targetFileName = `${appName}-${appVersion}-release.aab`;
  } else if (targetType === 'debug') {
    sourceFile = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    targetFileName = `${appName}-${appVersion}-debug.apk`;
  } else {
    sourceFile = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    targetFileName = `${appName}-${appVersion}-release.apk`;
  }

  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ No se encontró el archivo generado en: ${sourceFile}`);
    return null;
  }

  const destinationFile = path.join(distAndroidDir, targetFileName);
  fs.copyFileSync(sourceFile, destinationFile);

  const stats = fs.statSync(destinationFile);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  const fileBuffer = fs.readFileSync(destinationFile);
  const hashSha256 = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  console.log('===================================================================');
  console.log('🎉 ARCHIVO GENERADO CON ÉXITO:');
  console.log(`📁 Ubicación: ${destinationFile}`);
  console.log(`⚖️  Tamaño:    ${sizeMb} MB (${stats.size.toLocaleString()} bytes)`);
  console.log(`🔒 SHA-256:   ${hashSha256}`);
  console.log('===================================================================');

  if (targetType === 'aab') {
    console.log('\n💡 Para subir a Google Play Store:');
    console.log(`   1. Entra a Google Play Console (https://play.google.com/console).`);
    console.log(`   2. Ve a Producción o Pruebas internas > Crear nueva versión.`);
    console.log(`   3. Sube el archivo: ${destinationFile}\n`);
  } else {
    console.log('\n💡 Para instalar en tu teléfono Android:');
    console.log(`   - Conecta tu teléfono por USB con 'Depuración por USB' activada y ejecuta:`);
    console.log(`     npm run build:android:install`);
    console.log(`     o bien: adb install -r "${destinationFile}"`);
    console.log(`   - O copia el archivo APK a Google Drive / WhatsApp / Cable USB e instálalo.`);
  }

  return destinationFile;
}

function installOnAdbDevice(apkPath) {
  console.log('\n📲 Buscando dispositivos conectados con ADB...');
  try {
    const devicesOutput = execSync('adb devices', { encoding: 'utf8' });
    const lines = devicesOutput.trim().split('\n').slice(1).map(l => l.trim()).filter(Boolean);
    const devices = lines.filter(l => l.includes('\tdevice')).map(l => l.split('\t')[0]);

    if (devices.length === 0) {
      console.warn('⚠️  No se detectó ningún dispositivo o emulador Android conectado.');
      console.warn('   Asegúrate de tener un emulador abierto o tu teléfono con depuración USB activada.');
      return;
    }

    console.log(`📱 Dispositivo(s) detectado(s): ${devices.join(', ')}`);
    console.log(`🚀 Instalando ${path.basename(apkPath)}...`);

    const result = spawnSync('adb', ['install', '-r', apkPath], {
      stdio: 'inherit',
      env: process.env
    });

    if (result.status === 0) {
      console.log('✅ ¡Aplicación instalada exitosamente en el dispositivo!');
    } else {
      console.warn('⚠️  La instalación vía ADB reportó un error.');
    }
  } catch (e) {
    console.warn('⚠️  No se pudo comunicar con ADB:', e.message);
  }
}

function runStaticExport() {
  console.log('📦 Exportando bundle estático de Hermes y assets para Android...');
  const result = spawnSync('npx', ['expo', 'export', '--platform', 'android'], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env
  });
  if (result.status === 0) {
    console.log('\n✅ Exportación estática completada en la carpeta dist/');
  } else {
    console.error('\n❌ Error al exportar los archivos estáticos de Android.');
    process.exit(result.status || 1);
  }
}

function generateKeystore() {
  const defaultKeystorePath = path.join(androidDir, 'app', 'release.keystore');
  console.log('\n🔐 Generador de Keystore para firma de producción');
  console.log(`Destino por defecto: ${defaultKeystorePath}\n`);

  if (!fs.existsSync(androidDir)) {
    ensureNativePrebuild();
  }

  if (fs.existsSync(defaultKeystorePath)) {
    console.warn(`⚠️  Ya existe un archivo en: ${defaultKeystorePath}`);
    console.log('Si deseas conservarlo, renómbralo o muévelo antes de generar uno nuevo.\n');
    return;
  }

  console.log('Ejecutando keytool (Java Keytool)...');
  const keytoolArgs = [
    '-genkeypair',
    '-v',
    '-storetype', 'PKCS12',
    '-keystore', defaultKeystorePath,
    '-alias', 'psjavascript',
    '-keyalg', 'RSA',
    '-keysize', '2048',
    '-validity', '10000',
    '-storepass', 'android',
    '-keypass', 'android',
    '-dname', 'CN=PSJavaScript, OU=Dev, O=PSJavaScript, L=City, ST=State, C=MX'
  ];

  const result = spawnSync('keytool', keytoolArgs, {
    stdio: 'inherit',
    env: process.env
  });

  if (result.status === 0) {
    console.log('\n✅ Keystore creado exitosamente en:');
    console.log(`   ${defaultKeystorePath}`);
    console.log('   Alias: psjavascript');
    console.log('   Contraseña por defecto: android');
    console.log('\nPara usar contraseñas personalizadas, puedes definir las variables de entorno:');
    console.log('   export PSJS_STORE_FILE="release.keystore"');
    console.log('   export PSJS_STORE_PASSWORD="tu_password"');
    console.log('   export PSJS_KEY_ALIAS="tu_alias"');
    console.log('   export PSJS_KEY_PASSWORD="tu_password"\n');
  } else {
    console.error('❌ Error generando el keystore con keytool.');
  }
}
