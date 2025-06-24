# Peekaboo MCP - TDD Review

## Overview
Peekaboo MCP is a minimal Model Context Protocol server for read-only filesystem access. Currently has NO proper test framework, only a basic test client.

## Priority 1: Security Tests (CRITICAL)
- [ ] **Path Traversal Protection** - Test `normalizeAndValidatePath()` extensively
  - [ ] Test `../` attempts in various forms
  - [ ] Test absolute paths trying to escape root
  - [ ] Test symlink traversal attempts
  - [ ] Test URL-encoded path traversal attempts
- [ ] **URI Validation** - Test file:// URI parsing and validation
  - [ ] Test malformed URIs
  - [ ] Test non-file:// schemes
  - [ ] Test empty/null URIs

## Priority 2: Core Functionality Tests
- [ ] **Directory Listing**
  - [ ] Test recursive listing with depth limits
  - [ ] Test non-recursive listing
  - [ ] Test permission-denied handling
  - [ ] Test empty directories
  - [ ] Test deeply nested structures hitting maxDepth
- [ ] **File Reading**
  - [ ] Test reading various file types
  - [ ] Test reading large files
  - [ ] Test binary file handling (should fail gracefully)
  - [ ] Test reading directories as files (should error)
  - [ ] Test ENOENT (file not found) errors

## Priority 3: Configuration Tests
- [ ] **Environment Variables**
  - [ ] Test PEEKABOO_ROOT configuration
  - [ ] Test PEEKABOO_RECURSIVE flag
  - [ ] Test PEEKABOO_MAX_DEPTH parsing
  - [ ] Test invalid config values
- [ ] **Server Config Merging**
  - [ ] Test default config application
  - [ ] Test config override behavior

## Priority 4: Integration Tests
- [ ] **MCP Protocol Compliance**
  - [ ] Test ListResourcesRequest handling
  - [ ] Test ReadResourceRequest handling
  - [ ] Test error response formats
- [ ] **Server Lifecycle**
  - [ ] Test server startup/shutdown
  - [ ] Test transport connection

## Test Framework Recommendations

### 1. Use Vitest (MVP Choice)
```json
{
  "devDependencies": {
    "vitest": "^2.1.0",
    "@vitest/coverage-v8": "^2.1.0"
  },
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage"
  }
}
```

### 2. Test Structure
```
tests/
├── unit/
│   ├── fs-utils.test.ts      # Path validation, file operations
│   └── server-config.test.ts  # Config handling
├── integration/
│   └── mcp-server.test.ts     # Full server tests
└── fixtures/
    └── test-files/            # Test file structure
```

### 3. Essential Test Examples

```typescript
// tests/unit/fs-utils.test.ts
describe('normalizeAndValidatePath', () => {
  it('should block path traversal attempts', () => {
    expect(() => normalizeAndValidatePath('/root', '../etc/passwd'))
      .toThrow('Path traversal detected');
  });
  
  it('should allow valid subdirectory access', () => {
    const result = normalizeAndValidatePath('/root', 'subdir/file.txt');
    expect(result).toBe('/root/subdir/file.txt');
  });
});
```

## MVP Test Implementation Order
1. **Week 1**: Security tests for path traversal (MUST HAVE)
2. **Week 2**: Core fs-utils unit tests
3. **Week 3**: Basic integration tests
4. **Later**: Config tests, edge cases

## Key Testing Principles
- **Fast & Focused**: Each test should run in <50ms
- **Isolated**: No real filesystem access in unit tests (use mocks)
- **Clear Names**: `should_block_path_traversal_with_double_dots`
- **AAA Pattern**: Arrange, Act, Assert

## Skip These (YAGNI)
- Performance benchmarks
- Stress testing with massive directories  
- Cross-platform path testing (unless targeting Windows)
- WebSocket transport testing
- Concurrent request handling tests

## Quick Win Testing Checklist
- [ ] Install Vitest
- [ ] Write 5 path traversal security tests
- [ ] Write 3 basic file reading tests
- [ ] Write 2 directory listing tests
- [ ] Achieve >80% coverage on fs-utils.ts
- [ ] Add `npm test` to CI/CD pipeline