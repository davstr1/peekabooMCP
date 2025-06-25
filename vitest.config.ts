import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules', 
        'dist', 
        '**/test-*.ts', 
        '**/__tests__/**',
        '**/types.ts', 
        '*.config.ts',
        '*.cli.ts',
        '*-cli.ts',
        'human-cli.ts',
        'interactive-cli.ts',
        'mcp-cli.ts',
        'human-mcp-output.ts'
      ]
    }
  }
})