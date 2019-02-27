var env = {};

document.querySelector('body').onload = async function(event) {

  // Init environment.
  env = await getEnv();

  let params = getParams();

  // Show info alerts.
  switch (params.status) {
    case 'not_found':
      document.querySelector('#alert').removeAttribute('hidden');
      document.querySelector('#alert').textContent = 'Could not find a matching shortcut for this query.';
      break;
  }


  displaySettings();

  // Set query into input.
  document.querySelector('#query').value = env.query || '';

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

document.querySelector('#settingsClose').onclick = function(event) {
  updateNamespaces();
}

function displaySettings() {

  let params = getParams()

  // Set settings fields from environment.
  document.querySelector('#languageSetting').value = env.language;
  document.querySelector('#countrySetting').value = env.country;

  document.querySelector('#settingsEnv').value = jsyaml.dump(env);

  if (env.github) {
    document.querySelector('.using-advanced').classList.remove('d-none');
    document.querySelector('.using-basic').classList.add('d-none');
  }
  else {
    document.querySelector('.using-basic').classList.remove('d-none');
    document.querySelector('.using-advanced').classList.add('d-none');
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
  let urlProcess = baseUrl + 'process/index.html#query=%s&' + jqueryParam(params);
  let preProcessUrl = document.querySelector('.process-url');
  preProcessUrl.textContent = urlProcess;

  let paramStr = jqueryParam(params);
  window.location.hash = '#' + paramStr;
}

function updateNamespaces() {

  env.namespaces[0] = 'o';
  env.namespaces[1] = env.language;
  env.namespaces[2] = '.' + env.country;

  // Display "Saved.".
  document.querySelector('#settingsModal .saved').classList.remove('d-none');

  displaySettings();
}

$('#settingsModal').on('show.bs.modal', function (e) {
	// Hide "Saved."
  document.querySelector('#settingsModal .saved').classList.add('d-none');
});

document.querySelector('#languageSetting').onchange = function(event) {
  env.language = event.target.value;
  updateNamespaces();
}

document.querySelector('#countrySetting').onchange = function(event) {
  env.country = event.target.value;
  updateNamespaces();
}

