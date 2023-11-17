/** @module DataManager */

import fs from 'fs';
import jsyaml from 'js-yaml';

export default class DataManager {
  /**
   * Load data from /data.
   *
   * @return {object} data      - The loaded data from /data.
   */
  static load() {
    const ymlDirPath = './data/';
    const data = {};
    data['shortcuts'] = DataManager.readYmls(`${ymlDirPath}/shortcuts/`);
    data['types'] = {};
    data['types']['city'] = DataManager.readYmls(`${ymlDirPath}/types/city/`);
    console.log(data);
    return data;
  }

  static readYmls(ymlDirPath) {
    const dataByFileRoot = {};
    const fileNames = fs.readdirSync(ymlDirPath);
    for (const fileName of fileNames) {
      const filePath = ymlDirPath + fileName;
      const str = fs.readFileSync(filePath, 'utf8');
      const data = jsyaml.load(str);
      const fileRoot = fileName.split('.')[0];
      dataByFileRoot[fileRoot] = data;
    }
    return dataByFileRoot;
  }
}
