import jsyaml from "js-yaml";
import Helper from "../Helper.js";

export default class CityParser {
  static async parse(str, country, reload, debug) {
    const fetchUrlTemplate =
      "https://raw.githubusercontent.com/trovu/trovu-data/master/types/city/{%country}.yml";
    const fetchUrl = fetchUrlTemplate.replace("{%country}", country);

    const citiesYml = await Helper.fetchAsync(fetchUrl, reload, debug);
    if (citiesYml) {
      const cities = jsyaml.load(citiesYml);
      if (str in cities) {
        const city = cities[str];
        return city;
      }
    }

    return false;
  }
}
