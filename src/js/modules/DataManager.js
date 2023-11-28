/** @module DataManager */

import fs from 'fs';
import jsyaml from 'js-yaml';

export default class DataManager {
  /**
   * Load data from /data.
   * @return {object} data      - The loaded data from /data.
   */
  static load(
    ymlDirPath = './data',
    shortcutsPath = 'shortcuts',
    typesPath = 'types',
    filter = false,
  ) {
    const data = {};
    data['shortcuts'] = DataManager.readYmls(
      `${ymlDirPath}/${shortcutsPath}/`,
      filter,
    );
    data['types'] = {};
    data['types']['city'] = DataManager.readYmls(
      `${ymlDirPath}/${typesPath}/city/`,
    );
    return data;
  }

  /**
   * Write data to /data.
   * @param {object} data      - The data to write
   */
  static write(
    data,
    ymlDirPath = './data/',
    shortcutsPath = 'shortcuts',
    typesPath = 'types',
  ) {
    this.sortTags(data.shortcuts);
    DataManager.writeYmls(`${ymlDirPath}/${shortcutsPath}/`, data.shortcuts);
    DataManager.writeYmls(`${ymlDirPath}/${typesPath}/city/`, data.types.city);
  }

  /**
   * Sort tags in every shortcut.
   * @param {Object} shortcuts by namespace
   */
  static sortTags(shortcuts) {
    for (const namespace in shortcuts) {
      for (const key in shortcuts[namespace]) {
        const shortcut = shortcuts[namespace][key];
        if (shortcut.tags) {
          shortcut.tags.sort();
        }
      }
    }
  }

  /**
   * Read YAML files from a directory.
   * @param   {string} ymlDirPath
   * @returns {object} dataByFileRoot - The data from the YAML files.
   */
  static readYmls(ymlDirPath, filter = false) {
    const dataByFileRoot = {};
    let fileNames = fs.readdirSync(ymlDirPath);
    // Filter files by filter.
    if (filter) {
      fileNames = fileNames.filter((fileName) => {
        return fileName.includes(filter);
      });
    }
    for (const fileName of fileNames) {
      const filePath = ymlDirPath + fileName;
      const str = fs.readFileSync(filePath, 'utf8');
      const data = jsyaml.load(str);
      const fileRoot = fileName.replace(/\.yml$/, '');
      dataByFileRoot[fileRoot] = data;
    }
    return dataByFileRoot;
  }

  /**
   * Write YAML files to a directory.
   * @param {string} ymlDirPath
   * @param {object} dataByFileRoot - The data to write to YAML files.
   */
  static writeYmls(ymlDirPath, dataByFileRoot) {
    for (const fileRoot in dataByFileRoot) {
      const filePath = `${ymlDirPath}/${fileRoot}.yml`;
      const str = jsyaml.dump(dataByFileRoot[fileRoot], {
        noArrayIndent: true,
        lineWidth: -1,
      });
      fs.writeFileSync(filePath, str, 'utf8');
    }
  }
}
