function transformToAssocArray( paramStr ) {
  var params = {};
  var prmarr = paramStr.split("&");
  for ( var i = 0; i < prmarr.length; i++) {
    var tmparr = prmarr[i].split("=");
    params[tmparr[0]] = tmparr[1];
  }
  return params;
}

function getSearchParameters() {
  var paramStr = window.location.search.substr(1);
  return paramStr != null && paramStr != "" ? transformToAssocArray(paramStr) : {};
}
