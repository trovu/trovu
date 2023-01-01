const fs = require('fs');
const jsyaml = require('js-yaml');
const isValidDomain = require('is-valid-domain')

const actions = {};
const filters = {};

let ymlDirPath;

async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node index.js action [path]')
    return;
  }

  if (!process.env.TROVU_DATA_PATH) {
    console.log('Environment variable TROVU_DATA_PATH must contain full path to trovu-data directory. Pleas set with:')
    console.log('export TROVU_DATA_PATH=/path/to/trovu-data')
    return;
  }
  ymlDirPath = process.env.TROVU_DATA_PATH;

  const action = process.argv[2];
  if (action in actions) {
    actions[action]();
  }
  else {
    console.log('Action must be one of: ', Object.keys(actions));
  }
}

function loadYmls() {
  const ymls = {};
  const ymlFileNames = fs.readdirSync(ymlDirPath);
  for (const ymlFileName of ymlFileNames) {
    const ymlFilePath = ymlDirPath + ymlFileName;
    const ymlStr = fs.readFileSync(ymlFilePath, 'utf8');
    const shortcuts = jsyaml.load(ymlStr);
    ymls[ymlFilePath] = shortcuts;
  }
  return ymls;
}

function writeYmls(ymls) {
  for (const ymlFilePath in ymls) {
    const yml = ymls[ymlFilePath];
    const ymlStr = jsyaml.dump(yml, { noArrayIndent: true, lineWidth: -1 });
    fs.writeFileSync(ymlFilePath, ymlStr)
  }
  return ymls;
}

actions['normalize'] = async function () {
  const ymls = loadYmls();
  writeYmls(ymls);
}

const isValidUrl = urlString => {
  try {
    return Boolean(new URL(urlString));
  }
  catch (e) {
    return false;
  }
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 5000 } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
    headers: {
      "User-Agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
    }
  });
  clearTimeout(id);
  return response;
}

actions['testFetch'] = async function () {
    const response = await fetchWithTimeout(process.argv[3]);
    console.log(response);
}

actions['applyFilter'] = async function () {
  const ymlsAll = loadYmls();
  const ymls = {};
  const ymlFilePath = ymlDirPath + 'old-o.yml';
  ymls[ymlFilePath] = ymlsAll[ymlFilePath];
  for (const ymlFilePath in ymls) {
    const yml = ymls[ymlFilePath];
    for (const key in yml) {
      const shortcut = yml[key];
      const keepShortcut = await filters[process.argv[3]](shortcut);
      if (!keepShortcut) {
        delete yml[key];
      }

    }
  }
  writeYmls(ymls);
}

filters['removeDeadDomains'] = async function (shortcut) {
  const skipDomains = [
    'colourlovers.com',
    'iafd.com',
    'tcodesearch.com',
    'debian.org',
    'reddit.com',
  ];
  for (const skipDomain of skipDomains) {
    if (shortcut.url.search(new RegExp(skipDomain, "i")) > -1 ) {
      console.log('Skipping listed domain:', shortcut.url);
      return true;
    }
  }
  if (!isValidUrl(shortcut.url)) {
    console.log('Skipping invalid URL:', shortcut.url);
    return true;
  }
  const url = new URL(shortcut.url);
  if (!isValidDomain(url.hostname)) {
    console.log('Skipping invalid hostname:', url.host);
    return true;
  }
  // console.log(url.host);
  const testUrl = url.protocol + '//' + url.host;
  try {
    // console.log(testUrl, "...");
    const response = await fetchWithTimeout(testUrl);
    if (response.status != 200) {
      console.log(response.status, testUrl);
      return false;
    }
  }
  catch (error) {
    console.log(url.host);
    console.error(error);
    return false;
  }
  return true;
}

main();
