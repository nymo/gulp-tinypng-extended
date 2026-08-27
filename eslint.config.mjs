import eslint from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['node_modules/**', 'test/assets/**']
  },
  {
    files: ['**/*.js'],
    ...eslint.configs.recommended,
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.vitest
      }
    },
    rules: {
      'no-console': 'off'
    }
  }
];
