/* Regenerates FilmTrendAI.html (single-file build) from index.html,
   css/app.css and the js/ modules referenced by index.html.
   Run after any UI change:  node scripts/build-single.js  */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const read = p => fs.readFileSync(path.join(root, p), 'utf8');

let html = read('index.html');

// inline the stylesheet
const css = read('css/app.css');
html = html.replace(
  /<link rel="stylesheet" href="css\/app\.css[^"]*">/,
  () => `<style>\n${css}\n</style>`
);

// inline every local script, preserving index.html's load order
const scripts = [];
html = html.replace(
  /^\s*<script src="js\/([^"?]+)[^"]*"><\/script>\s*\n/gm,
  (_, file) => { scripts.push(`js/${file}`); return ''; }
);
const bundle = scripts.map(f => `/* ===== ${f} ===== */\n${read(f)}`).join('\n');
html = html.replace('</body>', `  <script>\n${bundle}\n</script>\n</body>`);

fs.writeFileSync(path.join(root, 'FilmTrendAI.html'), html);
console.log('FilmTrendAI.html regenerated —', scripts.length, 'scripts inlined,', html.length, 'chars');
