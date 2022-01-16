module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/app/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
