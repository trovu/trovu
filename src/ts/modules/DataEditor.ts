// @ts-nocheck
import DataManager from ".//DataManager";

export default class DataEditor {
  editData() {
    const data = DataManager.load();
    DataManager.write(data);
  }
}
