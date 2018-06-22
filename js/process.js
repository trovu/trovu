async function fetchAsync(url) {
  const response = await fetch(url);
  if (response.status != 200) {
    log("Fail:    " + url);
    return null;
  }
  log("Success: " + url);
  const text = await response.text();
  return text;
}

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
  var fetchUrl = fetchUrlTemplate;
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

function log(str) {
  document.querySelector('#log').textContent += "\n" + str;
}

async function fetchShortcuts(env, keyword, arguments) {
  
  // Fetch all available shortcuts for our query and namespace settings.
  var texts = [];
  let found = false;
  for (namespace of env.namespaces) {
    let fetchUrlTemplate = env.namespaceUrlTemplates[namespace];
    var fetchUrl = buildFetchUrl(namespace, keyword, arguments.length, fetchUrlTemplate);
    log("Request: " + fetchUrl);
    texts[namespace]  = await fetchAsync(fetchUrl);
    if (!found) {
      found = Boolean(texts[namespace]);
    }
  }
  return [texts, found];
}

async function processCall() {

  let env = getEnv();

  var variables = {
    language: env.language,
    country:  env.country
  };
  
  [keyword, argumentString] = splitKeepRemainder(env.query, " ", 2);
  if (argumentString) {
    var arguments = argumentString.split(",");
  } else {
    var arguments = []; 
  }

	// Check for extraNamespace in keyword.
	if (keyword.match(/\./)) {

  	[extraNamespace, keyword] = splitKeepRemainder(keyword, ".", 2);

		// Add to namespaces.
		env.namespaces.push(extraNamespace);

		// Set variables.
		switch (extraNamespace.length) {
			case 2:
			  variables.language = extraNamespace;
				break;
			case 3:
			  variables.country = extraNamespace;
				break;
		}
	}

  [texts, found] = await fetchShortcuts(env, keyword, arguments);

  // If nothing found:
  // Try without commas, i.e. with the whole argumentString as the only argument.
  if ((!found) && (arguments.length > 0)) {
    arguments = [argumentString];
    [texts, found] = await fetchShortcuts(env, keyword, arguments);
  }

  // Find first shortcut in our namespace hierarchy.
  for (namespace of env.namespaces.reverse()) {
    if (texts[namespace]) {
      var textLines = texts[namespace].split("\n");
      var redirectUrl = textLines.shift();
      // TODO: Process POST arguments.
      break;
    }
  }

  log('');
  log("Used template: " + redirectUrl);

  if (redirectUrl) {
    redirectUrl = replaceVariables(redirectUrl, variables);
    redirectUrl = replaceArguments(redirectUrl, arguments);
  }
  else {
    let params = getParams();
    params.status = 'not_found';
    let paramStr = jqueryParam(params);
    var redirectUrl = '../index.html#' + paramStr;
  }

  log("Redirect to:   " + redirectUrl)
  
  //console.log(redirectUrl);
  //return;

  window.location.href = redirectUrl;
}

