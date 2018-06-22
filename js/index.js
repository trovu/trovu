var env = {};

document.querySelector('body').onload = function(event) {

  // Init environment.
  env = getEnv();

	displaySettings();

  // Set query into input.
  document.querySelector('#query').value = env.query;

  // Show info alerts.
  switch (params.status) {
    case 'not_found':
      document.querySelector('#alert').removeAttribute('hidden');
      document.querySelector('#alert').textContent = 'Could not find a matching shortcut for this query.';
      break;
  }


	displaySettings();

  // Set query into input.
  document.querySelector('#query').value = env.query;
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

function displaySettings() {
  // Set settings fields from environment.
  document.querySelector('#languageSetting').value = env.language;
  document.querySelector('#countrySetting').value = env.country;
  document.querySelector('#namespacesSetting').value = env.namespaces.join(',');

  document.querySelector('ol.namespaces').innerHTML = '';

  // Show namespaces and their template URLs.
  for (i in env.namespaces) {
    let liElement = document.createElement('li');
    if (env.namespaces[i] in env.namespaceUrlTemplates) {
      liElement.setAttribute('title', env.namespaceUrlTemplates[env.namespaces[i]]);
      liElement.setAttribute('class', 'badge badge-primary');
    }
    else {
      liElement.setAttribute('class', 'badge badge-secondary');
    }
    liElement.textContent = env.namespaces[i];
    document.querySelector('ol.namespaces').append(liElement);
  }

  document.querySelector('.language.value').textContent = env.language;
  document.querySelector('.country.value').textContent = env.country;

  // Set Opensearch link.
  // TODO:
  // Why does let params not work here?
  params = buildParams();

  baseUrl = buildBaseUrl();
  let urlOpensearch = baseUrl + 'opensearch/?' + jqueryParam(params);

  let linkSearch = document.querySelector('#linkSearch');
  linkSearch.setAttribute('title', 'Trovu: ' + env.namespaces.join(','));
  linkSearch.setAttribute('href', urlOpensearch);

  // Set Process URL.
  let urlProcess = baseUrl + 'process/#query=%s&' + jqueryParam(params);
  let preProcessUrl = document.querySelector('pre.process-url');
  preProcessUrl.textContent = urlProcess;

  let paramStr = jqueryParam(params);
  window.location.hash = '#' + paramStr;
}

function updateNamespaces() {

  if (
		(env.namespaces.length == 3) &&
		(env.namespaces[0] == 'o') &&
		(env.namespaces[1].length == 2) &&
		(env.namespaces[2].length == 3)
	) {
		console.log('true');
    env.namespaces[1] = env.language;
    env.namespaces[2] = '.' + env.country;
	}
	displaySettings();
}

document.querySelector('#languageSetting').onchange = function(event) {
	env.language = event.target.value;
	updateNamespaces();
}

document.querySelector('#countrySetting').onchange = function(event) {
	env.country = event.target.value;
	updateNamespaces();
}

document.querySelector('#namespacesSetting').onchange = function(event) {
	env.namespaces = event.target.value.split(',');
	updateNamespaces();
}
