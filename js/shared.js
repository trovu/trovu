function decodeURIComponentWithPlus(str) {
  str = str.replace(/\+/g, ' ');
  str = decodeURIComponent(str);
  return str;
}

function splitKeepRemainder(string, delimiter, n) {
  if (!string) {
    return [];
  }
  var parts = string.split(delimiter);
  return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
}

function transformToAssocArray( paramStr ) {
  var params = {};
  var paramArray = paramStr.split("&");
  for ( var i = 0; i < paramArray.length; i++) {
    [key, value] = splitKeepRemainder(paramArray[i], "=", 2);
    key   = decodeURIComponentWithPlus(key);
    value = decodeURIComponentWithPlus(value);
    params[key] = value;
  }
  return params;
}


// jQuery Param handling ============================================

// Source:
// https://github.com/knowledgecode/jquery-param/blob/master/jquery-param.js
function jqueryParam(a) {
  var s = [];
  var add = function (k, v) {
    v = typeof v === 'function' ? v() : v;
    v = v === null ? '' : v === undefined ? '' : v;
    s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
  };
  var buildParams = function (prefix, obj) {
    var i, len, key;

    if (prefix) {
      if (Array.isArray(obj)) {
        for (i = 0, len = obj.length; i < len; i++) {
          buildParams(
            prefix + '[' + (typeof obj[i] === 'object' && obj[i] ? i : '') + ']',
            obj[i]
          );
        }
      } else if (String(obj) === '[object Object]') {
        for (key in obj) {
          buildParams(prefix + '[' + key + ']', obj[key]);
        }
      } else {
        add(prefix, obj);
      }
    } else if (Array.isArray(obj)) {
      for (i = 0, len = obj.length; i < len; i++) {
        add(obj[i].name, obj[i].value);
      }
    } else {
      for (key in obj) {
        buildParams(key, obj[key]);
      }
    }
    return s;
  };

  return buildParams('', a).join('&');
};


// Based on:
// https://stackoverflow.com/a/3355892/52023
function jqueryDeparam(paramStr) {

  // Prepare params.
  var params = {};

  // Get pairs.
  var keyValueStrings = paramStr.split('&');

  // Iterate over all pairs.
  for (keyValueString of keyValueStrings) {

    [name, value] = keyValueString.split('=');

    if (typeof value == 'undefined') {
      value = '';
    }

    // Decode.
    name = decodeURIComponent(name);
    value = value.replace(/\+/g, '%20');
    value = decodeURIComponent(value);

    name = name.trim();

    // Skip empty.
    if ('' == name) {
      continue;
    }

    // Prepare indices.
    var indices = [];

    // Move indices from string into array.
    var name = name.replace(/\[([^\]]*)\]/g, 
      function(k, idx) { indices.push(idx); return ""; });

    indices.unshift(name);
    var o = params;

    for (var j=0; j<indices.length-1; j++) {
      var idx = indices[j];
      if (!o[idx]) {
        o[idx] = {};
      }
      o = o[idx];
    }

    idx = indices[indices.length-1];
    if (idx == "") {
      o.push(value);
    }
    else {
      o[idx] = value;
    }
  }
  return params;
}

// Param getters ====================================================

function getSearchParameters() {
  var paramStr = window.location.hash.substr(1);
  let params = jqueryDeparam(paramStr);
  return params;
}

function getNamespaces(params) {

  var namespacesStr = params.namespaces || "";
  if (namespacesStr) {
    var namespaces = namespacesStr.split(',')
  }
  else {
    var namespaces = ['o','de','.de'];
  }
	return namespaces;
}

function getNamespaceUrlTemplates(params) {
  
  let namespaceUrlTemplates = params.namespace || {};
  return namespaceUrlTemplates;
}
