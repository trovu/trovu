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

function getSearchParameters() {
  var paramStr = window.location.search.substr(1);
  return paramStr != null && paramStr != "" ? transformToAssocArray(paramStr) : {};
}
