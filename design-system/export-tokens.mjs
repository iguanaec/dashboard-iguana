// Exporta tokens.css → tokens.json (para Figma, React Native, Flutter u otras apps).
// Uso:  node design-system/export-tokens.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(join(dir, 'tokens.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = {};
for (const [, name, value] of css.matchAll(/--ig-([a-z0-9-]+)\s*:\s*([^;]+);/g)) tokens[name] = value.trim().replace(/\s+/g, ' ');

// Agrupa por prefijo (color, green, radius, shadow…) y resuelve las referencias var(--ig-*)
const resolve = (value, depth = 0) => (depth > 8 ? value : value.replace(/var\(--ig-([a-z0-9-]+)\)/g, (_, ref) => resolve(tokens[ref] ?? `var(--ig-${ref})`, depth + 1)));
const grouped = {};
for (const [name, value] of Object.entries(tokens)) {
  const [group, ...rest] = name.split('-');
  (grouped[group] ??= {})[rest.join('-') || group] = { value: resolve(value), raw: value };
}
const out = { name: 'Iguana Design System', version: '0.1.0', tokens: grouped };
writeFileSync(join(dir, 'tokens.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`tokens.json: ${Object.keys(tokens).length} tokens en ${Object.keys(grouped).length} grupos`);
