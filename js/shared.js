function decodeURIComponentWithPlus(str) {
  str = str.replace(/\+/g, ' ');
  str = decodeURIComponent(str);
  return str;
}

function splitKeepRemainder(string, delimiter, n) {
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

// Source:
// https://stackoverflow.com/a/3355892/52023
function parseJQueryParams(paramStr) {

    // Prepare params.
    var params = {};

    // Get pairs.
    var keyValueStrings = paramStr.split('&');

    // Iterate over all pairs.
    for (var i=0; i<keyValueStrings.length; i++) {

        [name, value] = keyValueStrings[i].split('=');

        if (typeof value == 'undefined') {
          value = '';
        }

        var name = decodeURIComponent(name);
        var value = decodeURIComponent(value);

        // Prepare indices.
        var indices = [];

        var name = name.replace(/\[([^\]]*)\]/g, 
            function(k, idx) { indices.push(idx); return ""; });

        indices.unshift(name);
        var o = params;

        for (var j=0; j<indices.length-1; j++) {
            var idx = indices[j];
            var nextIdx = indices[j+1];
            if (!o[idx]) {
                if ((nextIdx == "") || (/^[0-9]+$/.test(nextIdx)))
                    o[idx] = [];
                else
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

function getSearchParameters() {
  var paramStr = window.location.hash.substr(1);
  return paramStr != null && paramStr != "" ? transformToAssocArray(paramStr) : {};
}
