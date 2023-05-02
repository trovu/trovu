import DateType from './date.js';

test('parseDateType', async () => {
  const locale = 'en-US';
  jest.useFakeTimers().setSystemTime(new Date(2020, 11, 31));
  const expectations = {
    2: new Date(2021, 0, 2),
    '2.': new Date(2021, 0, 2),
    22: new Date(2021, 0, 22),
    '22.': new Date(2021, 0, 22),
    22.11: new Date(2021, 10, 22),
    '22.11.': new Date(2021, 10, 22),
    '22.11.20': new Date(2020, 10, 22),
    '22.11.2020': new Date(2020, 10, 22),
    '11/22': new Date(2021, 10, 22),
    '11/22/20': new Date(2020, 10, 22),
    '+1': new Date(2021, 0, 1),
    '-1': new Date(2020, 11, 30),
  };
  for (const input in expectations) {
    const output = await DateType.parse(input, locale);
    expect(output.toDateString()).toEqual(expectations[input].toDateString());
  }
});
