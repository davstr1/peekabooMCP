# ACTION PLAN: Implement TDD Tests for Peekaboo MCP

## Phase 1: Test Infrastructure Setup (30 min)

### ☐ Install testing dependencies
```bash
npm install -D vitest @vitest/coverage-v8 @types/node
```

### ☐ Update package.json scripts
- ☐ Change existing test script to `"test:manual": "tsx test-mcp-actual.ts"`
- ☐ Add `"test": "vitest"`
- ☐ Add `"test:coverage": "vitest --coverage"`
- ☐ Add `"test:watch": "vitest --watch"`

### ☐ Create vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules', 'dist', 'test-*.ts', '**/types.ts']
    }
  }
})
```

### ☐ Create test directory structure
- ☐ Create `src/__tests__/` directory
- ☐ Create `src/__tests__/fixtures/` directory

## Phase 2: Critical Security Tests (1 hour)

### ☐ Create src/__tests__/security.test.ts
- ☐ Import necessary functions from fs-utils
- ☐ Set up test describe block for "Security - Path Traversal"

### ☐ Write path traversal tests
- ☐ Test: blocks `../` traversal attempt
- ☐ Test: blocks `..\\` (Windows style) traversal
- ☐ Test: blocks URL encoded traversal `%2e%2e%2f`
- ☐ Test: blocks absolute path `/etc/passwd`
- ☐ Test: blocks Windows absolute `C:\\Windows`
- ☐ Test: blocks complex traversal `./././../../../etc/passwd`
- ☐ Test: blocks traversal with null bytes
- ☐ Test: allows valid relative paths within root

### ☐ Verify all security tests pass
- ☐ Run `npm test security`
- ☐ Fix any failing tests
- ☐ Ensure 100% coverage of normalizeAndValidatePath

## Phase 3: Core fs-utils Tests (2 hours)

### ☐ Create src/__tests__/fs-utils.test.ts

### ☐ Test normalizeAndValidatePath (non-security cases)
- ☐ Test: normalizes `.` to root directory
- ☐ Test: handles empty string path
- ☐ Test: handles paths with trailing slashes
- ☐ Test: handles paths with multiple slashes

### ☐ Test listDirectory function
- ☐ Create mock file system fixture
- ☐ Test: lists files in root directory
- ☐ Test: lists nested directories when recursive=true
- ☐ Test: respects maxDepth parameter
- ☐ Test: stops at depth 1 when recursive=false
- ☐ Test: handles empty directories
- ☐ Test: handles permission denied errors gracefully
- ☐ Test: returns correct file metadata (size, modified date)

### ☐ Test readFileContent function
- ☐ Test: reads text file content
- ☐ Test: throws error for non-existent file
- ☐ Test: throws error for directory
- ☐ Test: handles permission denied

## Phase 4: Search Utils Tests (1 hour)

### ☐ Create src/__tests__/search-utils.test.ts

### ☐ Test searchByPath function
- ☐ Set up mock directory structure
- ☐ Test: matches `*.ts` pattern
- ☐ Test: matches `**/*.json` recursive pattern
- ☐ Test: matches `src/**/*.js` directory pattern
- ☐ Test: excludes node_modules automatically
- ☐ Test: excludes dist directory
- ☐ Test: excludes .git directory
- ☐ Test: case insensitive matching

### ☐ Test searchContent function
- ☐ Create mock files with content
- ☐ Test: finds simple text in files
- ☐ Test: returns correct line numbers
- ☐ Test: respects include pattern filter
- ☐ Test: handles ignoreCase flag correctly
- ☐ Test: limits results to maxResults
- ☐ Test: skips binary files
- ☐ Test: handles file read errors gracefully

## Phase 5: MIME Types Tests (30 min)

### ☐ Create src/__tests__/mime-types.test.ts

### ☐ Test getMimeType function
- ☐ Test: returns correct MIME for .js files
- ☐ Test: returns correct MIME for .json files
- ☐ Test: returns correct MIME for .md files
- ☐ Test: returns correct MIME for image files
- ☐ Test: returns text/plain for unknown extensions
- ☐ Test: handles files without extensions
- ☐ Test: case insensitive (.JS = .js)
- ☐ Test: handles multiple dots in filename

## Phase 6: MCP Integration Tests (2 hours)

### ☐ Create src/__tests__/mcp-integration.test.ts

### ☐ Test server creation
- ☐ Test: createPeekabooServer returns valid server
- ☐ Test: server has correct capabilities

### ☐ Test listResources handler
- ☐ Create test server with mock root
- ☐ Test: returns flat array of resources
- ☐ Test: includes both files and directories
- ☐ Test: URIs start with file://
- ☐ Test: metadata includes type and size
- ☐ Test: directories have hasChildren property

### ☐ Test readResource handler
- ☐ Test: reads file with valid file:// URI
- ☐ Test: returns correct MIME type
- ☐ Test: throws error for non-file:// URI
- ☐ Test: throws error for path traversal attempt
- ☐ Test: throws error for non-existent file

### ☐ Test listTools handler
- ☐ Test: returns search_path tool
- ☐ Test: returns search_content tool
- ☐ Test: tools have correct input schemas

### ☐ Test callTool handler
- ☐ Test: search_path tool executes correctly
- ☐ Test: search_content tool executes correctly
- ☐ Test: throws error for unknown tool
- ☐ Test: validates required parameters

## Phase 7: Error Handling Tests (1 hour)

### ☐ Create src/__tests__/error-handling.test.ts

### ☐ Test MCP error responses
- ☐ Test: ENOENT returns InvalidRequest error
- ☐ Test: EACCES returns InternalError
- ☐ Test: Path traversal returns specific error message
- ☐ Test: Malformed URI returns InvalidRequest

### ☐ Test error propagation
- ☐ Test: File system errors are caught and wrapped
- ☐ Test: Search errors are handled gracefully
- ☐ Test: Connection errors don't crash server

## Phase 8: Test Fixtures & Mocks (30 min)

### ☐ Create src/__tests__/fixtures/mock-fs.ts
- ☐ Define reusable file system structure
- ☐ Include various file types
- ☐ Include nested directories
- ☐ Include files with different permissions

### ☐ Create src/__tests__/helpers/test-utils.ts
- ☐ Helper to create test server
- ☐ Helper to create test client
- ☐ Helper to mock fs module
- ☐ Helper to assert MCP errors

## Phase 9: E2E Tests (1 hour)

### ☐ Create src/__tests__/e2e.test.ts

### ☐ Test full client-server flow
- ☐ Test: Client connects to server
- ☐ Test: Client lists resources
- ☐ Test: Client reads specific file
- ☐ Test: Client uses search tool
- ☐ Test: Client handles errors properly

### ☐ Test concurrent clients
- ☐ Test: Multiple clients can connect
- ☐ Test: Clients don't interfere with each other
- ☐ Test: Server handles concurrent requests

## Phase 10: CI/CD Setup (30 min)

### ☐ Create .github/workflows/test.yml
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        if: always()
```

### ☐ Add test status badge to README
### ☐ Configure branch protection rules
- ☐ Require tests to pass
- ☐ Require 60% coverage minimum

## Verification Checklist

### ☐ All tests pass: `npm test`
### ☐ Coverage meets minimum: `npm run test:coverage`
### ☐ No TypeScript errors: `npm run build`
### ☐ Tests run in CI/CD pipeline
### ☐ Security tests have 100% coverage
### ☐ Core functionality has >80% coverage

## Success Metrics

- ☐ Zero failing tests
- ☐ >60% overall code coverage
- ☐ 100% coverage on security functions
- ☐ <5 second test execution time
- ☐ All PRs require passing tests