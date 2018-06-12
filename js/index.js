var params;
var namespaces;
var namespaceUrlTemplates;

function init() {

  params = getSearchParameters()
  namespaces = getNamespaces(params);
  namespaceUrlTemplates = getNamespaceUrlTemplates(params);

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
  params['namespaces'] = namespaces.join(',');

  let paramStr = param(params);
  let processUrl = 'process/index.html?#' + paramStr;

  // Redirect to process script.
  window.location.href = processUrl;
}
