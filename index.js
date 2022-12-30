const fs = require('fs');
const jsyaml = require('js-yaml');

async function normalize() {
    const ymlDirPath = '/Users/jrg/cde/web/tro/trovu-data/shortcuts/';
    const ymlFileNames = fs.readdirSync(ymlDirPath);
    for (const ymlFileName of ymlFileNames) {
        const ymlFilePath = ymlDirPath + '/' + ymlFileName;
        console.log(ymlFilePath);
        const ymlIn = fs.readFileSync(ymlFilePath, 'utf8');
        const shortcuts = jsyaml.load(ymlIn);
        const ymlOut = jsyaml.dump(shortcuts, { noArrayIndent: true, lineWidth: -1 });
        fs.writeFileSync(ymlFilePath, ymlOut)
    }
}

normalize();