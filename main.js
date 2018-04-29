async function fetchAsync(url) {
  const response = await fetch(url, {cache: "force cache"});
	if (response.status != 200) {
		return null;
	}
  const json = await response.json();
  return json;
}

function getSearchParameters() {
  var prmstr = window.location.search.substr(1);
  return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
  var params = {};
  var prmarr = prmstr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
    var tmparr = prmarr[i].split("=");
    params[tmparr[0]] = tmparr[1];
  }
  return params;
}

var splitOnce = function(str, delim) {
  var components = str.split(delim);
  var result = [components.shift()];
  if(components.length) {
      result.push(components.join(delim));
  }
  return result;
};

function splitKeepRemainder(string, delimiter, n) {
  var parts = string.split(delimiter);
  return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
}

function buildFetchUrl(namespace, keyword, argumentCount) {

  var fetchUrl = "https://raw.githubusercontent.com/trovu/trovu/master/shortcuts/{%namespace}/{%keyword}/{%argumentCount}.call.json"

	namespace = encodeURIComponent(namespace);
	keyword   = encodeURIComponent(keyword);

  var replacements = {
    '{%namespace}': namespace,
    '{%keyword}': keyword,
    '{%argumentCount}': argumentCount
  }
  for (key in replacements) {
    fetchUrl = fetchUrl.replace(key, replacements[key]);
  }

  return fetchUrl;
}

async function processCall() {

  var params = getSearchParameters();
  var query = params.query;
  var query = decodeURIComponent(params.query);
  query = 'g foo';	
  query = 'db b,hh';	
	var namespaces = ['o','de','deu'];
  
  [keyword, argumentString] = splitOnce(query, " ");
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
	console.log(shortcut);
  // TODO: Further processing..
  //window.location.href = 'https://google.com';
}

