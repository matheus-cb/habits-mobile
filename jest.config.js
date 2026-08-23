/**
 * Camada única do mobile: nada aqui depende de serviço externo.
 *
 * O que precisa de teste é o caminho crítico de autenticação e check-in, e ele
 * passa por `expo-secure-store` e `fetch` — os dois dublados. O preset
 * `jest-expo` é o que resolve a transformação do Babel do Expo e os mocks dos
 * módulos nativos; sem ele, um simples `import` de `expo-secure-store` quebra.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
  coverageReporters: ['text', 'lcov'],
  // `clearMocks` limpa o histórico de chamadas entre testes — é o que se quer.
  // `resetMocks`/`restoreMocks` iriam além e apagariam a IMPLEMENTAÇÃO dos dublês
  // de `tests/setup.ts`, deixando `getItemAsync` devolvendo undefined. O cofre em
  // memória tem de sobreviver ao reset; o que se limpa entre testes é o conteúdo
  // dele, no `beforeEach` do setup.
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,
};
