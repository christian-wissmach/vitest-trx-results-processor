import { defineConfig, configDefaults } from 'vitest/config'

export default defineConfig({
  plugins: [],
  test: {
    exclude:[
      ...configDefaults.exclude,
      'examples/**/*'
    ]
  },
});
