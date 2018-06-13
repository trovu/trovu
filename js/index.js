var env = {};

document.querySelector('body').onload = function(event) {

  // Init environment.
  env = getEnv();

  // Set query into input.
  document.querySelector('#query').value = env.query;

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

  document.querySelector('.language.value').textContent = env.language;
  document.querySelector('.country.value').textContent = env.country;

  // Show info alerts.
  switch (params.status) {
    case 'not_found':
      document.querySelector('#alert').removeAttribute('hidden');
      document.querySelector('#alert').textContent = 'Could not find a matching shortcut for this query.';
      break;
  }

  // TODO:
  // Why does let params not work here?
  params = buildParams();
  let urlOpensearch = window.location.href + 'opensearch/?' + jqueryParam(params);

  let linkSearch = document.querySelector('#linkSearch');
  linkSearch.setAttribute('title', 'Trovu: ' + env.namespaces.join(','));
  linkSearch.setAttribute('href', urlOpensearch);
}

document.getElementById('query-form').onsubmit = function(event) {

  // Prevent default sending as GET parameters.
  event.preventDefault();


  let params = buildParams();
  params['query'] = document.getElementById('query').value; 

  let paramStr = jqueryParam(params);
  let processUrl = 'process/index.html?#' + paramStr;

  //console.log(processUrl);
  //return;

  // Redirect to process script.
  window.location.href = processUrl;
}


document.querySelector('button.add-search').onclick = function(event) {

  let urlOpensearch = document.querySelector('#linkSearch').getAttribute('href');
  window.external.AddSearchProvider(urlOpensearch);
}
