const docroot = 'http://l.tro/process/index.html?#debug=1';

const calls = [
  {
    language: 'de',
    country: 'de',
    query: 'db b,m,8,mo',
    expectedRedirectUrl: 'http://reiseauskunft.bahn.de/bin/query.exe/d?S=Berlin&Z=M%C3%BCnchen&time=08%3A00&date=09.09.2019&timesel=depart&start=1',
  },
  {
    language: 'de',
    country: 'pl',
    query: '.de.db b,m,8,mo',
    expectedRedirectUrl: 'http://reiseauskunft.bahn.de/bin/query.exe/d?S=Berlin&Z=M%C3%BCnchen&time=08%3A00&date=09.09.2019&timesel=depart&start=1',
  },
];

for (let call of calls) {
  test(JSON.stringify(call), async() => {
    let url = docroot;
    for (let paramName of ['language', 'country', 'github', 'query']) {
      if (paramName in call) {
        url += '&' + paramName + '=' + encodeURIComponent(call[paramName])
      }
    }
    await page.goto(url)
    await page.waitForFunction(
      'document.querySelector("body").innerText.includes("Redirect to:")'
    );
    await expect(page).toMatch(call.expectedRedirectUrl)
  });
}
