import Env from '../src/js/modules/Env.js';

const getNavigatorLanguageEnUk = () => {
  const languageStr = 'en-uk';
  return languageStr;
};

test('getNavigatorLanguage', () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  expect(env.getNavigatorLanguage()).toMatch('en-uk');
});

test('getLanguageAndCountryFromBrowser', () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  expect(env.getLanguageAndCountryFromBrowser()).toEqual({
    language: 'en',
    country: 'uk',
  });
});

test('setWithUserConfigFromGithub', async () => {
  const env = new Env();
  env.getNavigatorLanguage = getNavigatorLanguageEnUk;
  env.getUserConfigFromGithub = async () => {
    return {
      namespaces: ['o', 'en', '.us', { github: '.', name: 'my' }],
      defaultKeyword: 'g',
      language: 'en',
      country: 'us',
    };
  };
  await env.setWithUserConfigFromGithub();
  expect(env.namespaces).toEqual([
    'o',
    'en',
    '.us',
    { github: '.', name: 'my' },
  ]);
});
