import jsyaml from "js-yaml";
import Helper from "../Helper.js";

export default class CityType {
  static async parse(str, country, reload, debug) {
    const fetchUrlTemplate =
      "https://data.trovu.net/data/types/city/{%country}.yml";
    let matches;

    let abbreviation = str;
    if (matches = str.match(/^(\w\w+)(\.)(.+)$/)) {
      [, country, , abbreviation] = matches;
    }

    const fetchUrl = fetchUrlTemplate.replace("{%country}", country);

    const citiesYml = await Helper.fetchAsync(fetchUrl, reload, debug);
    if (citiesYml) {
      const cities = jsyaml.load(citiesYml);
      if (abbreviation in cities) {
        const city = cities[abbreviation];
        return city;
      }
    }

    return false;
  }
}
