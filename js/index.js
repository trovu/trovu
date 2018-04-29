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
