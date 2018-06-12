var params;
var namespaces;
var namespaceUrlTemplates;
var language;
var country;

function init() {

  // Init environment.
  params = getSearchParameters()
  namespaces = getNamespaces(params);
  namespaceUrlTemplates = getNamespaceUrlTemplates(params);
  [language, country] = getLanguageAndCountry(params); 

  // Set query into input.
  document.querySelector('#query').value = params.query || "";

  // Show namespaces and their template URLs.
  for (i in namespaces) {
    let liElement = document.createElement('li');
    liElement.setAttribute('class', 'badge badge-light');
    if (namespaces[i] in namespaceUrlTemplates) {
      liElement.setAttribute('title', namespaceUrlTemplates[namespaces[i]]);
    }
    liElement.textContent = namespaces[i];
    document.querySelector('ol.namespaces').append(liElement);
  }

  // Show info alerts.
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

  // Put environment into hash.
  params['query'] = document.getElementById('query').value; 
  params['namespaces'] = namespaces.join(',');
  params['language'] = language;
  params['country'] = country;

  let paramStr = jqueryParam(params);
  let processUrl = 'process/index.html?#' + paramStr;

  // Redirect to process script.
  window.location.href = processUrl;
}
