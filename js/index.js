var env = {};

function init() {

  // Init environment.
  env = getEnv();

  // Set query into input.
  document.querySelector('#query').value = params.query || "";

  // Show namespaces and their template URLs.
  for (i in env.namespaces) {
    let liElement = document.createElement('li');
    liElement.setAttribute('class', 'badge badge-light');
    if (env.namespaces[i] in env.namespaceUrlTemplates) {
      liElement.setAttribute('title', env.namespaceUrlTemplates[env.namespaces[i]]);
    }
    liElement.textContent = env.namespaces[i];
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

  params = {};

  // Put environment into hash.
  params['query'] = document.getElementById('query').value; 
  params['namespaces'] = env.namespaces.join(',');
  params['namespace'] = env.namespaceUrlTemplates;
  params['language'] = env.language;
  params['country'] = env.country;

  let paramStr = jqueryParam(params);
  let processUrl = 'process/index.html?#' + paramStr;

  // Redirect to process script.
  window.location.href = processUrl;
}
