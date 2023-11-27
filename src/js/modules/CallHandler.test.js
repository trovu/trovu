import CallHandler from './CallHandler.js';

test('CallHandler.getAlternative', async () => {
  const shortcut = {
    deprecated: {
      alternative: {
        query: 'gm b,<1>',
      },
    },
  };
  const env = {
    args: ['brandenburger tor'],
  };
  expect(CallHandler.getAlternative(shortcut, env)).toEqual(
    'gm b,brandenburger tor',
  );
});
