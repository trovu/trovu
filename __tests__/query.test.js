import Handle from '../public/js/handle.js';
import env from '../public/js//env.js';

const tests = [
  {
    language: 'de',
    country: 'de',
    query: 'db b,m,8,mo',
    expectedRedirectUrl: 'http://reiseauskunft.bahn.de/bin/query.exe/d?S=Berlin&Z=M%C3%BCnchen&time=08%3A00&date=09.09.2019&timesel=depart&start=1',
  },
];

for (let i in tests) {
  test(JSON.stringify(tests[i]), async() => {
    await env.populate(test[i]);
  });
}
