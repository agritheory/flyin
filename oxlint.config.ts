import type { OxlintConfig } from 'oxlint'

const config: OxlintConfig = {
  plugins: ['typescript', 'unicorn', 'oxc', 'import', 'promise', 'vitest', 'vue'],

  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
  },

  options: {
    reportUnusedDisableDirectives: 'warn',
    typeAware: true,
  },

  env: {
    browser: true,
    builtin: true,
    node: true,
    vitest: true,
    vue: true,
  },

  ignorePatterns: [
    '**/dist/**',
    '**/coverage/**',
    '**/node_modules/**',
    '**/*.config.ts',
  ],

  rules: {
    'eslint/no-unused-vars': 'off',
    'import/no-cycle': ['error', { maxDepth: 3 }],
    'import/no-unassigned-import': ['error', { allow: ['**/*.css', '**/*.scss', '**/*.sass'] }],
    'no-console': ['error', { allow: ['warn', 'error', 'debug', 'info'] }],
    'no-underscore-dangle': [
      'error',
      { allow: ['__dirname', '__filename', '__v_isReactive'] },
    ],
    'typescript/no-unsafe-type-assertion': 'error',
    'typescript/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },

  overrides: [
    {
      files: ['**/test/**', '**/*.{test,spec}.{ts,tsx,js,mjs}'],
      rules: {
        'unicorn/consistent-function-scoping': 'off',
        'unicorn/prefer-set-has': 'off',
        'no-console': 'off',
        'typescript/no-unsafe-type-assertion': 'off',
        'typescript/unbound-method': 'off',
        'vitest/expect-expect': 'warn',
        'vitest/no-conditional-expect': 'error',
        'vitest/no-disabled-tests': 'warn',
        'vitest/no-focused-tests': 'error',
        'vitest/require-mock-type-parameters': 'off',
        'vitest/valid-expect': 'off',
      },
    },
  ],
}

export default config
