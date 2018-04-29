function splitKeepRemainder(string, delimiter, n) {
  var parts = string.split(delimiter);
  return parts.slice(0, n - 1).concat([parts.slice(n - 1).join(delimiter)]);
}

function transformToAssocArray( paramStr ) {
  var params = {};
  var paramArray = paramStr.split("&");
  for ( var i = 0; i < paramArray.length; i++) {
    var tmparr = splitKeepRemainder(paramArray[i], "=", 2);
    params[tmparr[0]] = tmparr[1];
  }
  return params;
}

function getSearchParameters() {
  var paramStr = window.location.search.substr(1);
  return paramStr != null && paramStr != "" ? transformToAssocArray(paramStr) : {};
}
