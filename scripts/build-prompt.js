/* Regenerates js/prompt.js from prompts/media-studio-system-prompt.md.
   Run after editing the prompt:  node scripts/build-prompt.js  */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');

const md = fs.readFileSync(path.join(root, 'prompts/media-studio-system-prompt.md'), 'utf8');
const body = md.split('---\n').slice(1).join('---\n').trim();

fs.writeFileSync(
  path.join(root, 'js/prompt.js'),
  '/* Auto-generated from prompts/media-studio-system-prompt.md — regenerate with scripts/build-prompt.js */\n' +
  'const SYSTEM_PROMPT = ' + JSON.stringify(body) + ';\n'
);
console.log('js/prompt.js regenerated,', body.length, 'chars');
