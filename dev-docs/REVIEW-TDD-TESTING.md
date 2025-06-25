# Peekaboo MCP - TDD Testing Strategy Review

## Current State: NO TESTS! 🚨
The module has ZERO automated tests. Only manual integration tests exist.

## Why This Is Critical
- **Security Risk**: Path traversal protection is untested
- **Regression Risk**: Any change could break functionality
- **No CI/CD**: Can't automate deployments safely
- **No Coverage**: Don't know what's tested or not

## Actionable TDD Implementation Checklist

### 🔲 1. Set Up Test Infrastructure (30 min)
```bash
npm install -D vitest @vitest/coverage-v8 @types/node
```
- Add test script to package.json: `"test": "vitest"`
- Add coverage script: `"test:coverage": "vitest --coverage"`
- Create `vitest.config.ts` with proper Node.js environment

### 🔲 2. Unit Tests for fs-utils.ts (CRITICAL - 2 hours)
```typescript
// src/__tests__/fs-utils.test.ts
describe('normalizeAndValidatePath', () => {
  // Path traversal attacks (MUST TEST ALL)
  test('blocks ../ traversal')
  test('blocks encoded traversal (%2e%2e)')
  test('blocks backslash traversal')
  test('blocks absolute paths outside root')
  test('allows valid paths within root')
  test('handles symlinks safely')
})

describe('listDirectory', () => {
  test('lists files and directories')
  test('respects max depth')
  test('handles empty directories')
  test('handles permission errors gracefully')
  test('filters by recursive flag')
})
```

### 🔲 3. Unit Tests for search-utils.ts (1 hour)
```typescript
describe('searchByPath', () => {
  test('matches simple wildcards: *.ts')
  test('matches recursive wildcards: **/*.json')
  test('excludes node_modules by default')
  test('case insensitive matching')
})

describe('searchContent', () => {
  test('finds text in files')
  test('respects file pattern filter')
  test('handles case sensitivity flag')
  test('limits results to maxResults')
  test('shows line numbers correctly')
})
```

### 🔲 4. Unit Tests for mime-types.ts (30 min)
```typescript
describe('getMimeType', () => {
  test('detects common file types')
  test('returns text/plain for unknown')
  test('handles files without extensions')
  test('case insensitive extension matching')
})
```

### 🔲 5. Integration Tests for MCP Protocol (2 hours)
```typescript
// src/__tests__/mcp-integration.test.ts
describe('MCP Server Integration', () => {
  test('listResources returns flat array')
  test('resource URIs are properly formatted')
  test('readResource returns correct content')
  test('handles file:// URIs correctly')
  test('returns proper MCP errors')
})

describe('MCP Tools', () => {
  test('listTools returns both search tools')
  test('search_path tool works')
  test('search_content tool works')
  test('handles missing required params')
})
```

### 🔲 6. Security Test Suite (CRITICAL - 1 hour)
```typescript
// src/__tests__/security.test.ts
describe('Security Tests', () => {
  const attacks = [
    '../../../etc/passwd',
    '..\\..\\windows\\system32',
    '/etc/passwd',
    'C:\\Windows\\System32',
    '%2e%2e%2f',
    '....///',
    '/root/../etc/passwd',
    './././../../../etc/passwd'
  ];
  
  attacks.forEach(attack => {
    test(`blocks attack: ${attack}`, () => {
      // Test both listDirectory and readResource
    });
  });
})
```

### 🔲 7. Error Handling Tests (1 hour)
```typescript
describe('Error Scenarios', () => {
  test('ENOENT returns proper MCP error')
  test('EACCES returns permission error')
  test('Invalid URI format handled')
  test('Network errors propagated correctly')
})
```

### 🔲 8. Test Fixtures & Mocks (30 min)
```typescript
// src/__tests__/fixtures/test-fs.ts
export const mockFS = {
  '/test-root': {
    'file.txt': 'content',
    'nested': {
      'deep.json': '{"test": true}'
    }
  }
};

// Mock fs module for consistent tests
```

### 🔲 9. E2E Tests (1 hour)
```typescript
// src/__tests__/e2e.test.ts
describe('End-to-End', () => {
  test('client can connect and list resources')
  test('client can read files')
  test('client can use search tools')
  test('multiple clients work concurrently')
})
```

### 🔲 10. CI/CD Integration (30 min)
Create `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## MVP Test Priority

1. **Security tests for path traversal** (Do this FIRST!)
2. **Basic unit tests for fs-utils**
3. **Integration test for listResources**
4. **Integration test for readResource**
5. **Basic error handling tests**

## Red-Green-Refactor Cycle

For each test:
1. 🔴 Write failing test first
2. 🟢 Write minimal code to pass
3. 🔵 Refactor for clarity
4. 🔁 Repeat

## Expected Coverage Goals

- **Minimum MVP**: 60% coverage
- **Production Ready**: 80% coverage
- **Critical paths**: 100% coverage (security, path validation)

## Quick Start Commands

```bash
# Install test deps
npm install -D vitest @vitest/coverage-v8

# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for TDD
npm test -- --watch
```

## Summary

The module currently has NO automated tests. This is a critical gap, especially for security-sensitive filesystem operations. Start with security tests for path validation, then build out unit tests for core functionality. Use Vitest for speed and simplicity.