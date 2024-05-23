import DataManager from './/DataManager';
import QueryParser from './QueryParser';
import UrlProcessor from './UrlProcessor';
import fs from 'fs';

export default class DictionarySetter {
  constructor(options) {
    this.options = options;
    this.env = {
      data: DataManager.load(),
      language: 'en',
      country: 'us',
    };
  }

  setDictionaries() {
    DataManager.write(this.env.data);
  }
}
