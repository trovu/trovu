function init() {
  var params = getSearchParameters()
  switch (params.status) {
    case 'not_found':
      document.querySelector('#query').value = params.query;
      document.querySelector('#alert').removeAttribute('hidden');
      document.querySelector('#alert').textContent = 'Could not find a matching shortcut for this query.';
      break;
  }
}

document.getElementById('query-form').onsubmit = function(event) {

  // Prevent default sending as GET parameters.
  event.preventDefault();

	// Put query into hash.
	var query = document.getElementById('query').value; 
	var processUrl = 'process/index.html#query='  + encodeURIComponent(query);

  // Redirect to process script.
  window.location.href = processUrl;
}
