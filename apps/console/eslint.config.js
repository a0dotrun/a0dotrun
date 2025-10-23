//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    ignores: [
      'node_modules/**',
      'src/components/ui/**',
      'eslint.config.js',
      'prettier.config.js',
    ],
  },
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      'import/consistent-type-specifier-style': 'off',
      '@typescript-eslint/array-type': 'off',
      '@stylistic/spaced-comment': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/semi': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/space-before-function-paren': 'off',
      '@stylistic/max-len': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-console': 'off',
      'prefer-const': 'off',
      'no-shadow': 'off',
    },
  },
]
