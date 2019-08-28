import Helper from './helper.js'

let env = {

	configUrlTemplate: 'https://raw.githubusercontent.com/{%github}/trovu-data-user/master/config.yml',
	fetchUrlTemplateDefault: "https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/{%namespace}/{%keyword}/{%argumentCount}.yml",

  jqueryParam: function(a) {
    var s = [];
    var add = function (k, v) {
      v = typeof v === 'function' ? v() : v;
      v = v === null ? '' : v === undefined ? '' : v;
      s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
    };
    var buildParams = function (prefix, obj) {
      var i, len, key;
  
      if (prefix) {
        if (Array.isArray(obj)) {
          for (i = 0, len = obj.length; i < len; i++) {
            buildParams(
              prefix + '[' + (typeof obj[i] === 'object' && obj[i] ? i : '') + ']',
              obj[i]
            );
          }
        } else if (String(obj) === '[object Object]') {
          for (key in obj) {
            buildParams(prefix + '[' + key + ']', obj[key]);
          }
        } else {
          add(prefix, obj);
        }
      } else if (Array.isArray(obj)) {
        for (i = 0, len = obj.length; i < len; i++) {
          add(obj[i].name, obj[i].value);
        }
      } else {
        for (key in obj) {
          buildParams(key, obj[key]);
        }
      }
      return s;
    };
  
    return buildParams('', a).join('&');
  },
  
  
  // Based on:
  // https://stackoverflow.com/a/3355892/52023
	jqueryDeparam: function(paramStr) {
  
    // Prepare params.
    var params = {};
  
    // Get pairs.
    var keyValueStrings = paramStr.split('&');
  
    // Iterate over all pairs.
    for (let keyValueString of keyValueStrings) {
  
      let [name, value] = keyValueString.split('=');
  
      if (typeof value == 'undefined') {
        value = '';
      }
  
      // Decode.
      name = decodeURIComponent(name);
      value = value.replace(/\+/g, '%20');
      value = decodeURIComponent(value);
  
      name = name.trim();
  
      // Skip empty.
      if ('' == name) {
        continue;
      }
  
      // Prepare indices.
      let indices = [];
  
      // Move indices from string into array.
      name = name.replace(/\[([^\]]*)\]/g, 
        function(k, idx) { indices.push(idx); return ""; });
  
      indices.unshift(name);
      var o = params;
  
      for (var j=0; j<indices.length-1; j++) {
        var idx = indices[j];
        if (!o[idx]) {
          o[idx] = {};
        }
        o = o[idx];
      }
  
      idx = indices[indices.length-1];
      if (idx == "") {
        o.push(value);
      }
      else {
        o[idx] = value;
      }
    }
    return params;
  },
  
  // Param getters ====================================================
  
	getParams: function() {
    var paramStr = window.location.hash.substr(1);
    let params = this.jqueryDeparam(paramStr);
    return params;
  },
  
	getNamespaces: function(params) {
  
    var namespacesStr = params.namespaces || "";
    if (namespacesStr) {
      var namespaces = namespacesStr.split(',')
    }
    else {
      // Default namespaces.
      var namespaces = [
        'o',
        this.language,
        '.' +  this.country
      ];
    }
    return namespaces;
  },
  
	getNamespaceUrlTemplates: function(params) {
    
    let namespaceUrlTemplates = params.namespace || {};
    return namespaceUrlTemplates;
  },
  
	getDefaultLanguageAndCountry: function() {
    // Get from browser.
    let languageStr = navigator.language;
    let language, country;
    if (languageStr) {
      [language, country] = languageStr.split('-')
    }
  
    // Set defaults.
    language = language || 'en';
    country  = country || 'us';
  
    // Ensure lowercase.
    language = language.toLowerCase();
    country  = country.toLowerCase();
    return {
      language: language,
      country:  country
    };
  },
  
	getDefaultLanguage: function() {
    let languageCountry = this.getDefaultLanguageAndCountry();
    return languageCountry.language;
  },
  
	getDefaultCountry: function() {
    let languageCountry = this.getDefaultLanguageAndCountry();
    return languageCountry.country;
  },
  
	addFetchUrlTemplates: function(namespaces, params) {
  
    for (let i in namespaces) {
      // Site namespaces, from trovu-data.
      if (typeof namespaces[i] == 'string')  {
        if (namespaces[i].length < 4) {
          let name = namespaces[i];
          namespaces[i] = {
            name: name,
            url:  'https://raw.githubusercontent.com/trovu/trovu-data/master/shortcuts/' + name + '/{%keyword}/{%argumentCount}.yml'
          };
          namespaces[i].type = 'site';
        }
      // User namespaces may also have completely custom URL (template).
      // Must contain {%keyword} and {%argumentCount}.
      } else if ((namespaces[i].url) && (namespaces[i].name)) {
        namespaces[i].type = 'user';
      // User namespaces, from custom trovu-data-user.
      } else if (namespaces[i].github)  {
        if (namespaces[i].github == '.')  {
          // Set to current user.
          namespaces[i].github = params.github;
        }
        // Default to Github name.
        if (!namespaces[i].name) {
          namespaces[i].name = namespaces[i].github;
        }
        namespaces[i].url = 'https://raw.githubusercontent.com/' + namespaces[i].github + '/trovu-data-user/master/shortcuts/{%keyword}.{%argumentCount}.yml';
        namespaces[i].type = 'user';
      }
    }
    return namespaces;
  },
  
	withoutFunctions: function() {
		let envWithoutFunctions = {};
		for (let key of Object.keys(this)) {
			if (typeof this[key] != 'function') {
			  envWithoutFunctions[key]  = this[key];
			}
		}
		return envWithoutFunctions;
	},
	
	populate: async function() {

    let params = this.getParams()
    let githubFailed;
  
    // Try Github config.
    if (params.github) {
      let configUrl = this.configUrlTemplate.replace('{%github}', params.github);
      let configYml  = await Helper.fetchAsync(configUrl, false, params.debug);
      if (configYml) {
        Object.assign(this, jsyaml.load(configYml));
      }
      else {
        githubFailed = true;
        alert('Failed to read Github config from ' + configUrl)
      }
    }
  
    // Override all with params.
    Object.assign(this, params);
  
    if (githubFailed) {
      delete this.github; 
    }
  
    // Default language.
    if (typeof this.language != 'string') {
      this.language = this.getDefaultLanguage();
    }
    // Default country.
    if (typeof this.country != 'string') {
      this.country = this.getDefaultCountry();
    }
    // Default namespaces.
    if (typeof this.namespaces != 'object') {
      this.namespaces = [
        'o',
        this.language,
        '.' + this.country
      ];
    }
  
    this.namespaces = this.addFetchUrlTemplates(this.namespaces, params);
  }
}

export default env;
