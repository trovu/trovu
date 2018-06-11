function init() {
  let params = getSearchParameters()
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
  let params = {};
  params['query'] = document.getElementById('query').value; 
  params['namespaces'] = 'o,de,.de';
  let paramStr = buildParamStr(params);
  var processUrl = 'process/index.html?#' + paramStr;

  // Redirect to process script.
  window.location.href = processUrl;
}
