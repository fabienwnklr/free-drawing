// @ts-check
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

/** ESLint of the library: sources (JSDoc of every declaration, `@/` imports) and tests */
export default defineConfig(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: globals.browser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: { jsdoc },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'array-callback-return': ['error', { checkForEach: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['./**', '../**'], message: 'Import with @/ alias (src).' }] },
      ],
      'jsdoc/require-jsdoc': [
        'error',
        {
          require: { ClassDeclaration: true, FunctionDeclaration: true, MethodDefinition: true },
          checkConstructors: true,
          checkGetters: true,
          checkSetters: true,
        },
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': ['error', { checkDestructuredRoots: false }],
      'jsdoc/require-param-name': 'error',
      'jsdoc/require-param-description': 'error',
      'jsdoc/check-param-names': ['error', { checkDestructured: false }],
      'jsdoc/require-returns': ['error', { checkGetters: false }],
      'jsdoc/require-returns-description': 'error',
      'jsdoc/check-tag-names': ['error', { definedTags: ['typeParam', 'remarks'] }],
      'jsdoc/no-types': 'error',
      'jsdoc/no-undefined-types': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../src/**'], message: 'Import with @/ alias (src).' }] },
      ],
    },
  }
);
