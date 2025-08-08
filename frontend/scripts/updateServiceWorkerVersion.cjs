#!/usr/bin/env node

/**
 * Script para actualizar automáticamente la versión en el service worker
 * Se ejecuta durante el build para mantener sincronizada la versión
 */

const fs = require('fs');
const path = require('path');

function updateServiceWorkerVersion() {
  try {
    // Leer package.json para obtener la versión actual
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageJson = JSON.parse(packageContent);
    const version = packageJson.version;
    
    console.log(`[Build] Updating service worker to version: ${version}`);
    
    // Leer el service worker
    const swPath = path.join(__dirname, '..', 'public', 'sw.js');
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Actualizar la línea de VERSION
    const versionRegex = /const VERSION = '[^']*';/;
    const newVersionLine = `const VERSION = '${version}';`;
    
    if (versionRegex.test(swContent)) {
      swContent = swContent.replace(versionRegex, newVersionLine);
      console.log(`[Build] Updated VERSION constant to: ${version}`);
    } else {
      console.warn('[Build] Could not find VERSION constant in service worker');
      return false;
    }
    
    // Actualizar timestamp para forzar recarga del SW
    const buildTimestamp = new Date().toISOString();
    const timestampComment = `// Updated: ${buildTimestamp}`;
    
    // Agregar o actualizar el timestamp al principio del archivo
    const timestampRegex = /\/\/ Updated: [^\n]+\n?/;
    if (timestampRegex.test(swContent)) {
      swContent = swContent.replace(timestampRegex, timestampComment + '\n');
    } else {
      swContent = timestampComment + '\n' + swContent;
    }
    
    // Escribir el archivo actualizado
    fs.writeFileSync(swPath, swContent, 'utf8');
    
    console.log(`[Build] Service worker updated successfully with version ${version}`);
    console.log(`[Build] Build timestamp: ${buildTimestamp}`);
    
    return true;
  } catch (error) {
    console.error('[Build] Error updating service worker version:', error);
    return false;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const success = updateServiceWorkerVersion();
  process.exit(success ? 0 : 1);
}

module.exports = updateServiceWorkerVersion;