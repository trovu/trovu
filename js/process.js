/**
 * Build fetch URL given the necessary parameters.
 *
 * @param {string} namespace        - The namespace to use.
 * @param {string} keyword          - The keyword to use.
 * @param {string} argumentCount    - The argumentCount to use.
 * @param {string} fetchUrlTemplate - A template containing placeholders for all the above.
 *
 * @return {string} fetchUrl        - The URL with the replaced placeholders.
 */
function buildFetchUrl(namespace, keyword, argumentCount, fetchUrlTemplate) {

  if (!fetchUrlTemplate) {
    fetchUrlTemplate = fetchUrlTemplateDefault;
  }

  namespace = encodeURIComponent(namespace);
  keyword   = encodeURIComponent(keyword);

  var replacements = {
    '{%namespace}':     namespace,
    '{%keyword}':       keyword,
    '{%argumentCount}': argumentCount
  }
  let fetchUrl = str_replace_all(fetchUrlTemplate, replacements);

  return fetchUrl;
}

/**
 * Get placeholder names from a string.
 *
 * @param {string} str    - The string containing placeholders.
 * @param {string} prefix - The prefix of the placeholders. Must be Regex-escaped.
 *
 * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
 *
 *   If the placeholder with the same name occurs multiple times, there are also
 *   multiple arrays in the nested array. 
 *
 *   Example: 
 *     http://{%first|type=foo}{%first|type=bar}
 *   becomes:
 *   Array 
 *       (
 *            [first] => Array
 *            (
 *                [{%first|type=foo}] => Array
 *                    (
 *                        [type] => foo
 *                    )
 *                [{%first|type=bar}] => Array
 *                    (
 *                        [type] => bar
 *                    )
 *            )
 *        )
 */
function getPlaceholdersFromString(str, prefix) {

  var pattern = '{' + prefix + '(.+?)}';
  var re = RegExp(pattern, 'g');
  var match;
  var placeholders = {};

  do {
    match = re.exec(str);
    if (!match) {
      break;
    }

    // Example value:
    // match[1] = 'query|encoding=utf-8|another=attribute'
    var nameAndAttributes = match[1].split('|');

    // Example value:
    // name = 'query'
    var name = nameAndAttributes.shift();

    var placeholder = {};
    // Example value:
    // name_and_attributes = ['encoding=utf-8', 'another=attribute']
    for (let attrStr of nameAndAttributes) {
      let attrName, attrValue;
      [attrName, attrValue] = attrStr.split('=', 2);
      placeholder[attrName] = attrValue;
    }
    placeholders[name] = placeholders[name] || {};
    placeholders[name][match[0]] = placeholder;

  } while (match);

  return placeholders;
}

/**
 * Get argument names from a string.
 *
 * @param {string} str    - The string containing placeholders.
 *
 * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
 */
function getArgumentsFromString(str) {
  return getPlaceholdersFromString(str, '%')
}

/**
 * Get variable names from a string.
 *
 * @param {string} str    - The string containing placeholders.
 *
 * @return {object} placeholders - Array keyed with the arguments names and with an array of corresponding placeholders.
 */
function getVariablesFromString(str) {
  return getPlaceholdersFromString(str, '\\$')
}

async function replaceArguments(str, args, env) {

  let locale = env.language + '-' + env.country.toUpperCase();

  var placeholders = getArgumentsFromString(str);

  for (let argumentName in placeholders) {

    var argument = args.shift();

    // Copy argument, because different placeholders can cause
    // different processing.
    var processedArgument = argument;

    processedArgument = processedArgument.trim();
    
    // An argument can have multiple matches,
    // so go over all of them.
    var matches = placeholders[argumentName];
    let match;
    for (let match in matches) {
      var attributes = matches[match];
      switch (attributes.type) {
          
        case 'date':

          const dateModule = await import('./type/date.js');
          let date = await dateModule.default.parse(processedArgument, locale);

          // If date could be parsed:
          // Set argument.
          if ((date) && (date.format() != 'Invalid date')) {
            let format = 'YYYY-MM-DD';
            if (attributes.output) {
              format = attributes.output;
            }
            processedArgument = date.format(format);
          }

          break;

        case 'time':

          // Load time.js
          if (typeof parse_time !== "function") {
            await loadScripts(['../js/type/time.js']);
          }

          let time = await parse_time(processedArgument, locale);

          // If time could be parsed:
          // Set argument.
          if ((time) && (time.format() != 'Invalid time')) {
            let format = 'HH:mm';
            if (attributes.output) {
              format = attributes.output;
            }
            processedArgument = time.format(format);
          }

          break;

        case 'city':

          const module = await import('./type/city.js');
          let city = await module.default.parse(processedArgument, env.country, env.reload, env.debug);
          
          // If city could be parsed:
          // Set argument.
          if (city) {
            processedArgument = city;
          }

          break;
      }
      switch (attributes.transform) {
        case 'uppercase':
          processedArgument = processedArgument.toUpperCase();
          break;
        case 'lowercase':
          processedArgument = processedArgument.toLowerCase();
          break;
      }
      switch (attributes.encoding) {
        case 'iso-8859-1':
          processedArgument = escape(processedArgument);
          break;
        case 'none':
          break;
        default:
          processedArgument = encodeURIComponent(processedArgument);
          break;
      }
      str = str.replace(match, processedArgument);
    }
  }
  return str;
}


async function replaceVariables(str, variables) {

  var placeholders = getVariablesFromString(str);

  for (let varName in placeholders) {
    var matches = placeholders[varName];
    for (let match in matches) {
      var attributes = matches[match];
      switch(varName) {
        case 'now':

          // Load momentjs.
          if (typeof moment !== "function") {
            await loadScripts([momentjsUrl]);
          }

          let time = moment();

          let format = 'HH:mm';
          if (attributes.output) {
            format = attributes.output;
          }
          var value = time.format(format);

          break; 
            
        default:
          var value = variables[varName];
          break; 
      }
      str = str.replace(new RegExp(escapeRegExp(match), 'g'), value);
    }
  }
  return str;
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

async function fetchShortcuts(env, keyword, args) {
  
  // Fetch all available shortcuts for our query and namespace settings.
  var shortcuts = [];
  let found = false;
  for (let namespace of env.namespaces) {
    var fetchUrl = buildFetchUrl(namespace, keyword, args.length, namespace.url);
    let text  = await fetchAsync(fetchUrl, env.reload, env.debug);
    shortcuts[namespace.name] = jsyaml.load(text);

    if (!found) {
      found = Boolean(shortcuts[namespace.name]);
    }
  }
  return [shortcuts, found];
}

async function getRedirectUrl(env) {

  if (!env.query) {
    return;  
  }

  var variables = {
    language: env.language,
    country:  env.country
  };
  
  let keyword, argumentString;
  [keyword, argumentString] = splitKeepRemainder(env.query, " ", 2);
  if (argumentString) {
    var args = argumentString.split(",");
  } else {
    var args = []; 
  }

  // Check for (cache) reload call.
  env.reload = false;
  if (keyword.match(/^reload:/)) {
    [reload, keyword] = splitKeepRemainder(keyword, ":", 2);
    env.reload = true;
  }
  // Check for extraNamespace in keyword:
  //   split at dot
  //   but don't split up country namespace names.
  if (keyword.match(/.\./)) {

    // Lookbehind not needed anymore
    // since we made sure in if-condition
    // that the dot is preceeded by something.
    [extraNamespace, keyword] = splitKeepRemainder(keyword, /\./, 2);

    // Add to namespaces.
    env.namespaces.push(extraNamespace);

    // Set variables.
    switch (extraNamespace.length) {
      case 2:
        variables.language = extraNamespace;
        break;
      case 3:
        // TODO: cut dot?
        variables.country = extraNamespace;
        break;
    }
  }

  let shortcuts, found;
  [shortcuts, found] = await fetchShortcuts(env, keyword, args);

  // If nothing found:
  // Try without commas, i.e. with the whole argumentString as the only argument.
  if ((!found) && (args.length > 0)) {
    args = [argumentString];
    [shortcuts, found] = await fetchShortcuts(env, keyword, args);
  }

  // If nothing found:
  // Try default keyword.
  if ((!found) && (env.defaultKeyword)) {
    args = [env.query];
    [shortcuts, found] = await fetchShortcuts(env, env.defaultKeyword, args);
  }

  let redirectUrl = null;

  // Find first shortcut in our namespace hierarchy.
  for (let namespace of env.namespaces.reverse()) {
    if (shortcuts[namespace.name]) {
      redirectUrl = shortcuts[namespace.name]['url'];
      // TODO: Process POST arguments.
      break;
    }
  }

  if (!redirectUrl) {
    return;
  }

  if (env.debug) log('');
  if (env.debug) log("Used template: " + redirectUrl);

  redirectUrl = await replaceVariables(redirectUrl, variables);
  redirectUrl = await replaceArguments(redirectUrl, args, env);

  return redirectUrl;
}

// TODO: Refactor this. Appears for now in:
//   process.js
//   time.js
//   date.js
async function loadScripts(scripts) {
    
    function get (src) {
        return new Promise(function (resolve, reject) {
            var el = document.createElement("script");
            el.async = true;
            el.addEventListener("load", function () {
                resolve(src);
            }, false);
            el.addEventListener("error", function () {
                reject(src);
            }, false);
            el.src = src;
            (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(el);
        });
    }

    const myPromises = scripts.map(async function (script, index) {
        return await get(script);
    });

    return await Promise.all(myPromises);
}

document.querySelector('body').onload = async function(event) {

  let env = await getEnv();

  let redirectUrl = await getRedirectUrl(env);

  if (!redirectUrl) {
    let params = getParams();
    params.status = 'not_found';
    let paramStr = jqueryParam(params);
    redirectUrl = '../index.html#' + paramStr;
  }

  if (env.debug) {
    log("Redirect to:   " + redirectUrl)
    return;
  }

  window.location.href = redirectUrl;
}


