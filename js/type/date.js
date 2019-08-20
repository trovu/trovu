// TODO: Refactor this. Appears for now in:
//   process.js
//   time.js
//   date.js
async function loadScripts(scripts) {
    
    function get (src) {
        return new Promise(function (resolve, reject) {
            var el = document.createElement("script");
            el.async = true;
            el.addEventListener("load", function () {
                resolve(src);
            }, false);
            el.addEventListener("error", function () {
                reject(src);
            }, false);
            el.src = src;
            //el.type = 'module';
            (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(el);
        });
    }

    const myPromises = scripts.map(async function (script, index) {
        return await get(script);
    });

    return await Promise.all(myPromises);
}

async function parse_date(str, locale) {

  // Load momentjs.
  if (typeof moment !== "function") {
    await loadScripts([momentjsUrl]);
  }

  let date;

  moment.locale(locale);

  let now = moment();

  // Match '2', '2.', '22', '22.'.
  if (str.match(/^(\d{1,2})(\.)?$/)) {
    date = moment(str, 'DD');
    // If date in past: set it to next month.
    if (date < now) {
      date.add(1, 'month');
    }
  }
  // Match '22.11' and '22.11.'
  if (str.match(/^(\d{1,2})\.(\d{1,2})(\.)?$/)) {
    date = moment(str, 'DD.MM');
    // If date in past: set it to next year.
    if (date < now) {
      date.add(1, 'year');
    }
  }
  // Match '22.11.13'
  if (str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2})?$/)) {
    date = moment(str, 'DD.MM.YY');
  }
  // Match '22.11.2013'
  if (str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})?$/)) {
    date = moment(str, 'DD.MM.YYYY');
  }

  // Match '11/22'.
  if (str.match(/^(\d{1,2})\/(\d{1,2})$/)) {
    date = moment(str, 'MM/DD');
    // If date in past: set it to next year.
    if (date < now) {
      date.add(1, 'year');
    }
  }
  // Match '11/22/13'
  if (str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})?$/)) {
    date = moment(str, 'MM/DD/YY');
  }
  // Match '11/22/2013'
  if (str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})?$/)) {
    date = moment(str, 'MM/DD/YYYY');
  }
  // Match '+1' or '-2'
  if (matches = str.match(/^(-|\+)(\d+)$/)) {
    date = now;
    switch (matches[1]) {
      case '+':
        date.add(matches[2], 'days');
        break;
      case '-':
        date.subtract(matches[2], 'days');
        break;
    }
  }
  // Match 'Su', 'Mo', ...
  if (str.match(/^([A-Za-z\u00E0-\u00FC]+)$/)) {
    date = moment().day(str)
    if (date < now) {
      date.add(1, 'week');
    }
  }

  return date;
}
