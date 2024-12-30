/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  // verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@minigame/ecs(.*)$': '<rootDir>/packages/ecs/src$1',
    '^@minigame/utils(.*)$': '<rootDir>/packages/utils/src$1',
  },
  roots: ['<rootDir>'],
  modulePaths: ['<rootDir>', '<rootDir>/node_modules'],
  testEnvironment: 'node',
  // collectCoverage: true
};
