const docroot = 'http://l.tro/process/index.html?#debug=1&';

const tests = [
  {
    queryStr: 'language=de&country=de&query=db b%2Cm%2C8%2Cmo&',
    expectedRedirectUrl: 'http://reiseauskunft.bahn.de/bin/query.exe/d?S=Berlin&Z=M%C3%BCnchen&time=08%3A00&date=09.09.2019&timesel=depart&start=1',
  },
];

for (let i in tests) {
  test(JSON.stringify(tests[i]), async() => {
    await page.goto(docroot + tests[i].queryStr)
    await expect(page).toMatch(tests[i].expectedRedirectUrl)
  });
}
