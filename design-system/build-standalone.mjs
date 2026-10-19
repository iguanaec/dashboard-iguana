// Genera iguana-design-system.html: un solo archivo (CSS, JS e imágenes embebidos).
// Uso: node design-system/build-standalone.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');
const b64 = (f, mime) => `data:${mime};base64,${readFileSync(join(here, f)).toString('base64')}`;

let html = read('index.html');
const css = ['tokens.css', 'components.css', 'docs.css'].map(read).join('\n');
const js = ['ig.js', 'docs.js'].map(read).join('\n;\n');

html = html
  .replace(/<link rel="stylesheet" href="(tokens|components|docs)\.css" \/>\n?/g, '')
  .replace(/<script src="(ig|docs)\.js" defer><\/script>\n?/g, '')
  .replace('</head>', () => `<style>\n${css}\n</style>\n</head>`)
  .replace('</body>', () => `<script>\n${js.replace(/<\/script/gi, '<\\/script')}\n</script>\n</body>`)
  .replace('href="../images/favicon-32.png"', () => `href="${b64('../images/favicon-32.png', 'image/png')}"`)
  .replace(/src="\.\.\/images\/apple-touch-icon\.png"/g, () => `src="${b64('../images/apple-touch-icon.png', 'image/png')}"`)
  .replace(/src="\.\.\/images\/logo-iguana\.webp"/g, () => `src="${b64('../images/logo-iguana.webp', 'image/webp')}"`);

writeFileSync(join(here, 'iguana-design-system.html'), html);
console.log('OK', (html.length / 1024).toFixed(0) + ' KB');

// Variante para publicar como Artifact: sin <html>/<head>/<body>, con fondo explícito en body.
const art = html
  .replace(/<!DOCTYPE html>\s*<html[^>]*>\s*<head>/i, '')
  .replace(/<meta charset[^>]*>\s*/i, '')
  .replace(/<meta name="viewport"[^>]*>\s*/i, '')
  .replace(/<meta name="theme-color"[^>]*>\s*/i, '')
  .replace('</head>', '')
  .replace(/<body class="ig-root">/, '<div class="ig-root" id="ig-app">')
  .replace(/<\/body>\s*<\/html>\s*$/i, '</div>')
  .replace('<style>', '<style>\nbody { background: #f1f5f2; margin: 0; }\n');
// Uso: node design-system/build-standalone.mjs <ruta-salida-artifact>   (opcional)
if (process.argv[2]) {
  writeFileSync(process.argv[2], art);
  console.log('Artifact', (art.length / 1024).toFixed(0) + ' KB');
}
