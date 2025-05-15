import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,ts,vue}'],
    languageOptions: {
      parser: tseslint.parser,
      globals: globals.browser,
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      vue: pluginVue,
    },
    rules: {
      // optional: turn off ESLint rules that clash with Prettier
      'vue/html-indent': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'semi': 'off',
      'quotes': 'off',
      'comma-dangle': 'off',
    },
  },
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],
]);
