import UrlProcessor from './UrlProcessor.js';
import dayjs from 'dayjs';

test('processTypeDate', async () => {
  const expectations = {
    31.12: dayjs()
      .set('month', 12 - 1)
      .set('date', 31),
    '31.12.': dayjs()
      .set('month', 12 - 1)
      .set('date', 31),
  };
  'so mo di mi do fr sa'.split(' ').forEach((dow, index) => {
    expectations[dow] = dayjs()
      .day(index)
      .add(dayjs().day() > index - 1 ? 7 : 0, 'day');
  });
  for (const input in expectations) {
    expectations[input] = expectations[input].format('YYYY-MM-DD');
  }
  const locale = 'de-DE';
  const attributes = {};
  for (const input in expectations) {
    const output = await UrlProcessor.processTypeDate(
      input,
      locale,
      attributes,
    );
    expect(output).toEqual(expectations[input]);
  }
});
