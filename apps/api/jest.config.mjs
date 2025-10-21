/** @type {import('jest').Config} */
const config = {
  rootDir: '.',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  setupFiles: ['dotenv/config'],
};

export default config;
