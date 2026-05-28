const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const baseDir = path.resolve(__dirname, '..', 'data');
const outputPath = path.resolve(__dirname, '..', 'dist', 'public', 'data.json');

function readYmls(dir) {
  const out = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.yml')) continue;
    const key = file.replace(/\.yml$/, '');
    out[key] = yaml.load(fs.readFileSync(path.join(dir, file), 'utf8'));
  }
  return out;
}

const data = {
  shortcuts: readYmls(path.join(baseDir, 'shortcuts')),
  types: {
    city: readYmls(path.join(baseDir, 'types', 'city')),
    date: readYmls(path.join(baseDir, 'types', 'date')),
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(data), 'utf8');
console.log(`Wrote ${outputPath}`);
