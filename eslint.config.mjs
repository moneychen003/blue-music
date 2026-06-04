import config from '@any-listen/eslint/eslint.config.mjs'

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...config,
  {
    ignores: ['build'],
  },
]
