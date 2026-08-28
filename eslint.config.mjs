import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const languageOptions = {
  ecmaVersion: 2021,
  sourceType: 'commonjs',
  globals: {
    ...globals.node,
    ...globals.vitest
  }
};

export default [
  {
    ignores: ['node_modules/**', 'test/assets/**', 'coverage/**', 'dist/**']
  },
  {
    files: ['**/*.js'],
    ...eslint.configs.recommended,
    languageOptions,
    rules: {
      'no-console': 'off'
    }
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.{ts,tsx,mts,cts}']
  })),
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions,
    rules: {
      'no-console': 'off'
    }
  }
];
