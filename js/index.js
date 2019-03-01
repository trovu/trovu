var env = {};
var suggestions = [];

async function getSuggestions() {

  // Use global var
  // reset it.
  suggestions = [];
  let foundShortcuts = {}

  // Prefetch suggestions.
  // Iterate over namespaces in reverse order.
  for (namespace of env.namespaces.reverse()) {
    // Load precompiled JSON.
    let json;
    try {
      json = await fetchAsync('https://data.trovu.net/suggestions/' + namespace.name + '.json');
    } catch(e) {
      console.log(e);
    }
    if (!json) {
      continue;
    }
    let shortcuts = JSON.parse(json);
    // Iterate over all shortcuts.
    for (shortcut of shortcuts) {
      let key = shortcut.keyword + '.' + shortcut.arguments.length;
      // If not yet present: reachable.
      // (Because we started with most precendent namespace.)
      if (!(key in foundShortcuts)) {
        shortcut.reachable = true;
        suggestions.push(shortcut);
      }
      // Others are unreachable
      // but can be reached with namespace forcing.
      else {
        shortcut.reachable = false;
        suggestions.push(shortcut);
      }
      foundShortcuts[key] = true;
    }
  }
  return suggestions;
}

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


  updateConfig();

  // Set query into input.
  document.querySelector('#query').value = env.query || '';

  $('#query').autocomplete({
    minLength: 1,
    //source: ['one','two']
    source: function (request, response) {
      let matches = {
        keywordFullReachable:  [],
        keywordFullUnreachable:  [],
        keywordBeginReachable:  [],
        keywordBeginUnreachable:  [],
        titleBeginReachable:  [],
        titleBeginUnreachable:  [],
        titleMiddleReachable:  [],
        titleMiddleUnreachable:  [],
      };
      for (suggestion of suggestions) {
        if (request.term == suggestion.keyword) {
          if (suggestion.reachable) {
            matches.keywordFullReachable.push(suggestion);
          }
          else {
            matches.keywordFullReachable.push(suggestion);
          }
          continue;
        }
        let pos = suggestion.keyword.search(new RegExp(request.term, 'i'))
        if (pos == 0) {
          if (suggestion.reachable) {
            matches.keywordBeginReachable.push(suggestion);
          }
          else {
            matches.keywordBeginUnreachable.push(suggestion);
          }
          continue;
        }
        pos = suggestion.title.search(new RegExp(request.term, 'i'))
        if (pos == 0) {
          if (suggestion.reachable) {
            matches.titleBeginReachable.push(suggestion);
          }
          else {
            matches.titleBeginUnreachable.push(suggestion);
          }
          continue;
        }
        if (pos > 0) {
          if (suggestion.reachable) {
            matches.titleMiddleReachable.push(suggestion);
          }
          else {
            matches.titleMiddleUnreachable.push(suggestion);
          }
          continue;
        }
      }
      let result = [];
      result = result.concat(
        matches.keywordFullReachable,
        matches.keywordFullUnreachable,
        matches.keywordBeginReachable,
        matches.keywordBeginUnreachable,
        matches.titleBeginReachable,
        matches.titleBeginUnreachable,
        matches.titleMiddleReachable,
        matches.titleMiddleUnreachable
      ).slice(0,20);
      response(result);
    }
  })
  .data('uiAutocomplete')._renderItem = function( ul, item ) {

    var namespace_html = 
      '<span class="namespace">' + 
      item.namespace   
      '</span>';

    var keyword = item.keyword;

    // add "namespace." if unreachable
    if (!item.reachable) {
      keyword = item.namespace + '.' + keyword; 
    }
    var argument_names = item.arguments.join(', ');
    var title = item.title;

    var html = 
      '<a' + 
        ( item.reachable ? "" : " class='unreachable'" ) + 
        '>' + 
        '&nbsp;'+ // to make bar visible /float:-related problem
        '<span class="float-left">'+
          '<span class="keyword">' + 
            keyword +
          '</span>'+
          '<span class="argument-names">' + 
            argument_names +
          '</span>'+
        '</span>'+
        '<span class="float-right">'+
          '<span class="title">' + 
            title +
          '</span>' +
          namespace_html +
        '</span>'+
      '</a>' +
      '';
      
    return $( "<li></li>" )
      .data( "item.autocomplete", item )
      .append(html)
      .appendTo( ul );
  };
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

document.querySelector('#settingsSave').onclick = function(event) {

  env.language = document.querySelector('#languageSetting').value;
  env.country  = document.querySelector('#countrySetting').value;

  updateConfig();
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
}

async function updateConfig() {

  if (!env.github) {
    env.namespaces = [
      'o',
      env.language,
      '.' + env.country
    ];
    env.namespaces = addFetchUrlTemplates(env.namespaces);
  }

  await getSuggestions();

  displaySettings();

  // Set Opensearch link.
  // TODO:
  // Why does let params not work here?
  params = buildParams();

  /*
  baseUrl = buildBaseUrl();
  let urlOpensearch = baseUrl + 'opensearch/?' + jqueryParam(params);

  let linkSearch = document.querySelector('#linkSearch');
  linkSearch.setAttribute('title', 'Trovu: ' + env.namespaces.join(','));
  linkSearch.setAttribute('href', urlOpensearch);

  // Set Process URL.
  let urlProcess = baseUrl + 'process/index.html#query=%s&' + jqueryParam(params);
  let preProcessUrl = document.querySelector('.process-url');
  preProcessUrl.textContent = urlProcess;
*/

  let paramStr = jqueryParam(params);
  window.location.hash = '#' + paramStr;
}
