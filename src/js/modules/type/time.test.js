import TimeType from './time.js';

test('parseTimeType', async () => {
  jest.useFakeTimers().setSystemTime(new Date(2020, 0, 1, 12, 0, 0));
  const expectations = {
    15: new Date(2020, 0, 1, 15, 0),
    '15:00': new Date(2020, 0, 1, 15, 0),
    '+1': new Date(2020, 0, 1, 13, 0),
    '-1': new Date(2020, 0, 1, 11, 0),
  };
  for (const input in expectations) {
    const output = await TimeType.parse(input);
    expect(output).toEqual(expectations[input]);
  }
});
