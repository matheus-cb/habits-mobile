// Flat config do ESLint 9, baseada no preset do Expo (que já traz as regras de
// React, React Hooks, React Native e import).
const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'coverage/*', 'patches/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // `console.warn`/`console.error` são a saída de diagnóstico do app em
      // dispositivo; `console.log` esquecido em produção é ruído.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Testes: `any` em dublê de módulo nativo é o custo de tipar o que o runtime
    // entrega, e proibi-lo aqui empurraria para casts piores.
    files: ['tests/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
