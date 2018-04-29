async function fetchAsync(url) {
  const response = await fetch(url, {cache: "force cache"});
  if (response.status != 200) {
    return null;
  }
  const json = await response.json();
  return json;
}

function splitKeepRemainder(string, delimiter, n) {
  var parts = string.split(delimiter);
  return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
}

function buildFetchUrl(namespace, keyword, argumentCount) {

  var fetchUrl = "https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/{%namespace}/{%keyword}/{%argumentCount}.call.json"

  namespace = encodeURIComponent(namespace);
  keyword   = encodeURIComponent(keyword);

  var replacements = {
    '{%namespace}':     namespace,
    '{%keyword}':       keyword,
    '{%argumentCount}': argumentCount
  }
  for (key in replacements) {
    fetchUrl = fetchUrl.replace(key, replacements[key]);
  }

  return fetchUrl;
}

/**
 * Get argument names from a string.
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
    for (attrStr of nameAndAttributes) {
      [attrName, attrValue] = attrStr.split('=', 2);
      placeholder[attrName] = attrValue;
    }
    placeholders[name] = placeholders[name] || {};
    placeholders[name][match[0]] = placeholder;

  } while (match);

  return placeholders;
}

function getArgumentsFromString(str) {
  return getPlaceholdersFromString(str, '%')
}

function getVariablesFromString(str) {
  return getPlaceholdersFromString(str, '\\$')
}

function replaceArguments(str, arguments) {

  var placeholders = getArgumentsFromString(str);

  for (argumentName in placeholders) {

    var argument = arguments.shift();

    // Copy argument, because different placeholders can cause
    // different processing.
    var processedArgument = argument;

    processedArgument = processedArgument.trim();
    
    // An argument can have multiple matches,
    // so go over all of them.
    var matches = placeholders[argumentName];
    for (match in matches) {
      var attributes = matches[match];
      switch (attributes.type) {
        default:
          processedArgument = encodeURIComponent(argument);
          break;
      }
    }
    str = str.replace(match, processedArgument);
  }
  return str;
}


function replaceVariables(str, variables) {

  var placeholders = getVariablesFromString(str);

  for (varName in placeholders) {
    var matches = placeholders[varName];
    for (match in matches) {
      var attributes = matches[match];
      switch(varName) {
        case 'now':
          // TODO.
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

async function processCall() {

  var params = getSearchParameters();
  var query = params.query;
  if (!query) {
    return;
  }

  // Remove plus signs and decode.
  query = query.replace(/\+/g, ' ');
  query = decodeURIComponent(query);
  
  //query = 'g foo';  
  //query = 'db b, hh';  
  var namespaces = ['o','de','deu'];

  var variables = {
    language: 'de' 
  };
  
  [keyword, argumentString] = splitKeepRemainder(query, " ", 2);
  var arguments = argumentString.split(",");
  
  // Fetch all available shortcuts for our query and namespace settings.
  var shortcuts = [];
  for (namespace of namespaces) {
    var fetchUrl = buildFetchUrl(namespace, keyword, arguments.length);
    shortcuts[namespace]  = await fetchAsync(fetchUrl);
  }

  // Find first shorcut in our namespace hierarchy.
  for (namespace of namespaces.reverse()) {
    if (shortcuts[namespace]) {
      var shortcut = shortcuts[namespace];
      break;
    }
  }

  if (shortcut) {
    var url = shortcut['url'];
    url = replaceVariables(url, variables);
    url = replaceArguments(url, arguments);
    //console.log(url);
    //return;
  }
  else {
    var redirectUrl = '../index.html?status=not_found&query=' + encodeURIComponent(query);
  }

  window.location.href = redirectUrl;
}

