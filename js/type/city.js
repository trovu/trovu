export default class CityParser {

  static async parse(str, country, reload, debug) {
  
    let fetchUrlTemplate = 'https://raw.githubusercontent.com/trovu/trovu-data/master/types/city/{%country}.yml';
    let fetchUrl = fetchUrlTemplate.replace('{%country}', country );
  
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
