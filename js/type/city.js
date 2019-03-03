async function parse_city(str, country, debug) {

  let fetchUrlTemplate = 'https://raw.githubusercontent.com/trovu/trovu-data/master/types/city/{%country}.yml';
 
  var replacements = {
    '{%country}':     country,
  }
  let fetchUrl = str_replace_all(fetchUrlTemplate, replacements);

  let citiesYml  = await fetchAsync(fetchUrl, false, debug);
  if (citiesYml) {
    cities = jsyaml.load(citiesYml);
  }

  if (str in cities) {
    city = cities[str];
    return city;
  }

  return false;
}
