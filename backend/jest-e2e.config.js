/** E2E tests: full Nest app + fake Core Hub JWKS server + real PostgreSQL test database */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFiles: ['<rootDir>/test/e2e-setup.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  testTimeout: 30000,
};
