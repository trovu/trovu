import Env from '../public/js/env.js';

test('env', () => {
  const env = new Env();
  
  env.getNavigatorLanguage = () => {
    const languageStr = 'en-uk';
    return languageStr;
  }

  expect(env.getNavigatorLanguage()).toMatch('en-uk');
} );