function transformToAssocArray( paramStr ) {
  var params = {};
  var paramArray = paramStr.split("&");
  for ( var i = 0; i < paramArray.length; i++) {
    var tmparr = paramArray[i].split("=");
    params[tmparr[0]] = tmparr[1];
  }
  return params;
}

function getSearchParameters() {
  var paramStr = window.location.search.substr(1);
  return paramStr != null && paramStr != "" ? transformToAssocArray(paramStr) : {};
}
