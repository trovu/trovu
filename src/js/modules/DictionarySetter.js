import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';
import fs from 'fs';

export default class DictionarySetter {
  constructor() {}

  setDictionaries() {
    const data = DataManager.load();
    DataManager.write(data);
  }
}
