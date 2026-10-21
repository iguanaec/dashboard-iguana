// Genera panel-iguana.html: el panel completo (modo diseño, datos de ejemplo) en UN solo archivo.
// Uso: node build-demo.mjs [ruta-salida-artifact]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(join(here, f), 'utf8');
const b64 = (f, mime) => `data:${mime};base64,${readFileSync(join(here, f)).toString('base64')}`;
const safe = (js) => js.replace(/<\/script/gi, '<\\/script');

const css = ['design-system/tokens.css', 'design-system/components.css', 'styles.css', 'merc.css', 'tone.css'].map(read).join('\n');
const js = ['demo-api.js', 'design-system/ig.js', 'merc.js', 'app.js'].map((f) => safe(read(f))).join('\n;\n');
const cdn = [...read('index.html').matchAll(/<script src="(https:\/\/cdn\.jsdelivr\.net[^"]+)" defer><\/script>/g)].map((m) => `<script src="${m[1]}"></script>`).join('\n');

let html = read('index.html')
  .replace(/<link href="design-system\/tokens\.css"[^>]*>\n<link href="design-system\/components\.css"[^>]*>\n<link href="styles\.css"[^>]*>\n<link href="merc\.css"[^>]*>\n<link href="tone\.css"[^>]*>/, () => `<style>\n${css}\n</style>`)
  .replace(/<script src="https:\/\/cdn\.jsdelivr\.net[^>]*><\/script>\n/g, '')
  .replace(/<!-- Modo diseño[^>]*-->\n/, '')
  .replace(/<script src="demo-api\.js" defer><\/script>\n<script src="design-system\/ig\.js" defer><\/script>\n<script src="merc\.js" defer><\/script>\n<script src="app\.js" defer><\/script>\n/, '')
  .replace('<script src="design-system/icons.js"></script>', () => `<script>\n${safe(read('design-system/icons.js'))}\n</script>`)
  .replace('</body>', () => `${cdn}\n<script>\n${js}\n</script>\n</body>`)
  .replace(/href="images\/favicon-32\.png"/, () => `href="${b64('images/favicon-32.png', 'image/png')}"`)
  .replace(/href="images\/apple-touch-icon\.png"/, () => `href="${b64('images/apple-touch-icon.png', 'image/png')}"`)
  .replace(/src="images\/apple-touch-icon\.png"/g, () => `src="${b64('images/apple-touch-icon.png', 'image/png')}"`)
  .replace(/src="images\/logo-iguana\.webp"/g, () => `src="${b64('images/logo-iguana.webp', 'image/webp')}"`);

writeFileSync(join(here, 'panel-iguana.html'), html);
console.log('panel-iguana.html', (html.length / 1024).toFixed(0) + ' KB');

// Variante para publicar como Artifact: sin <html>/<head>/<body>; el body se configura por script.
if (process.argv[2]) {
  const art = html
    .replace(/<!DOCTYPE html>\s*<html[^>]*>\s*<head>/i, '')
    .replace(/<meta charset[^>]*>\s*/i, '')
    .replace(/<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<meta name="theme-color"[^>]*>\s*/i, '')
    .replace('</head>', '')
    .replace(/<body class="ig-root" data-state="loading">/, '<script>document.body.classList.add("ig-root");document.body.dataset.state="loading";</script>')
    .replace(/<\/body>\s*<\/html>\s*$/i, '');
  writeFileSync(process.argv[2], art);
  console.log('artifact', (art.length / 1024).toFixed(0) + ' KB');
}
