const fs = require('fs');
const jsyaml = require('js-yaml');
const { mainModule } = require('process');

const actions = {};

actions['normalize'] = async function () {
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

async function main() {
    if (process.argv.length < 3) {
        console.log('Usage: node index.js action [path]')
        return;
    }
    const action = process.argv[2];
    if (action in actions) {
        actions[action]();
    }
    else {
        console.log('Action must be one of: ', Object.keys(actions));
    }
}

main();