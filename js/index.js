var params = getSearchParameters()
var namespaces = getNamespaces(params);
var namespaceUrlTemplates = getNamespaceUrlTemplates(params);

function init() {
  document.querySelector('#query').value = params.query || "";
  switch (params.status) {
    case 'not_found':
      document.querySelector('#alert').removeAttribute('hidden');
      document.querySelector('#alert').textContent = 'Could not find a matching shortcut for this query.';
      break;
  }
}

document.getElementById('query-form').onsubmit = function(event) {

  // Prevent default sending as GET parameters.
  event.preventDefault();

  // Put query into hash.
  params['query'] = document.getElementById('query').value; 
  params['namespaces'] = namespaces;
  let paramStr = buildParamStr(params);
  var processUrl = 'process/index.html?#' + paramStr;

  // Redirect to process script.
  window.location.href = processUrl;
}
