module.exports = {
  rootDir: '.',
  testRegex: 'test/db\\.e2e-spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
};
