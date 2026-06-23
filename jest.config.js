const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig.json')

globalThis.ngJest = {
  skipNgcc: true,
  tsconfig: 'tsconfig.spec.json',
}

/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    'project/ws/**/*.ts',
    '!**/*.spec.ts',
    '!**/*.module.ts',
    '!**/*.d.ts',
    '!**/public-api.ts',
    '!**/index.ts',
    '!**/*.model.ts',
    '!**/environments/**',
    '!**/*.routing.ts',
    '!**/*-routing.module.ts',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/out-tsc/'],
  transformIgnorePatterns: [
    '/node_modules/(?!.*\\.mjs$|keycloak-js/|keycloak-angular/)',
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(compilerOptions.paths || {}, { prefix: '<rootDir>/' }),
    '^@ws/app$': '<rootDir>/project/ws/app/src/public-api.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
}
