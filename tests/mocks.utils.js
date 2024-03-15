global.fetch = jest.fn((url) => {
  if (url.includes('/testuser/trovu-data-user/master/config.yml')) {
    return Promise.resolve({
      status: 200,
      text: () => Promise.resolve('defaultKeyword: g'),
    });
  } else if (url.includes('/testuser/trovu-data-user/master/shortcuts.yml')) {
    return Promise.resolve({
      status: 200,
      text: () =>
        Promise.resolve(
          'keyword1 1: https://www.google.com/search?hl=en&q=keyword1%20{%query}&ie=utf-8',
        ),
    });
  }
});

beforeAll(() => {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
});

afterAll(() => {
  jest.clearAllMocks();
});
