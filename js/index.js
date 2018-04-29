function init() {
  var params = getSearchParameters()
  switch (params.status) {
    case 'not_found':
      document.querySelector('#query').value = params.query;
      break;
  }
}
