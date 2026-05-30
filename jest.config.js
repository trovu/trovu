/** @type {import('jest').Config} **/
module.exports = {
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>/src/ts", "<rootDir>/tests"],
  transform: {
    "^.+.tsx?$": "babel-jest",
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  modulePathIgnorePatterns: ["<rootDir>/ext/raycast/"],
  testPathIgnorePatterns: ["<rootDir>/ext/raycast/", "<rootDir>/tests/playwright/", "<rootDir>/tests/cypress/"],
};
