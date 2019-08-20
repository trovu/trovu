export default class CityParser {

	// TODO: refactor. Is also in shared.js.
  static str_replace_all(str, replacements) {
  
    for (let key in replacements) {
      str = str.replace(key, replacements[key]);
    }
    return str;
  }

  static async parse(str, country, reload, debug) {
  
    let fetchUrlTemplate = 'https://raw.githubusercontent.com/trovu/trovu-data/master/types/city/{%country}.yml';
   
    var replacements = {
      '{%country}':     country,
    }
    let fetchUrl = this.str_replace_all(fetchUrlTemplate, replacements);
  
    let citiesYml  = await fetchAsync(fetchUrl, reload, debug);
    if (citiesYml) {
      let cities = jsyaml.load(citiesYml);
      if (str in cities) {
        let city = cities[str];
        return city;
      }
    }
  
    return false;
  }

}
