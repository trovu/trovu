/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",
  roots: ["<rootDir>/src/ts", "<rootDir>/tests"],
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
  moduleFileExtensions: ["ts", "js", "json", "node"],
  modulePathIgnorePatterns: ["<rootDir>/ext/raycast/"],
  testPathIgnorePatterns: ["<rootDir>/ext/raycast/", "<rootDir>/tests/playwright/", "<rootDir>/tests/cypress/"],
};
