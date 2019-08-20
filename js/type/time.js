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

async function parse_time(str, locale) {

  // Load momentjs.
  if (typeof moment !== "function") {
    await loadScripts([momentjsUrl]);
  }

  let time;

  let now = moment();

  // Match '2', '2.', '22', '22.'.
  if (str.match(/^(\d{1,2})(\.)?$/)) {
    time = moment(str, 'DD');
    // If time in past: set it to next month.
    if (time < now) {
      time.add(1, 'month');
    }
  }
  // Match '11'
  if (str.match(/^(\d+)$/)) {
    time = moment(str, 'HH');
  }
  // Match '11:23' and '11.23'
  if (str.match(/^(\d+)(\.|:)(\d+)$/)) {
    time = moment(str, 'HH:mm');
  }
  // Match '+1' and '-2'
  if (matches = str.match(/^(-|\+)(\d+)$/)) {
    time = now;
    switch (matches[1]) {
      case '+':
        time.add(matches[2], 'hours');
        break;
      case '-':
        time.subtract(matches[2], 'hours');
        break;
    }
  }

  return time;
}
