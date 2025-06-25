# Testing Guide for peekaboo-mcp

## Overview

This guide covers how to run tests, understand the test structure, and contribute new tests to the peekaboo-mcp project.

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test -- src/__tests__/fs-utils.test.ts
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Test Structure

The test suite is organized into several categories:

### Unit Tests

1. **Core Utilities**
   - `fs-utils.test.ts` - File system operations
   - `search-utils.test.ts` - File search functionality
   - `mime-types.test.ts` - MIME type detection

2. **Security Tests**
   - `security.test.ts` - Path traversal protection
   - `find-project-root.test.ts` - Project root detection security

3. **MCP Protocol Tests**
   - `mcp-handlers.test.ts` - MCP handler unit tests
   - `index.test.ts` - Server initialization tests

4. **Resource Management**
   - `resource-manager.test.ts` - Timeout and size limit tests

### Integration Tests

- `mcp-integration.test.ts` - Full client-server integration tests

### Stress & Edge Case Tests

- `stress.test.ts` - Performance and scalability tests
- `edge-cases.test.ts` - Unusual scenarios and boundary conditions

## Test Coverage

Current test coverage targets:
- Core utilities: 95-100%
- Security functions: 100%
- MCP handlers: 80%+
- Overall: 80%+

View detailed coverage report:
```bash
npm test -- --coverage
open coverage/index.html
```

## Writing Tests

### Test File Structure

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('Component Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Feature Group', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Mocking

Use Vitest's mocking capabilities:

```typescript
// Mock a module
vi.mock('../fs-utils.js');

// Mock specific function
vi.mocked(fsUtils.listDirectory).mockResolvedValue([]);

// Spy on function
const spy = vi.spyOn(object, 'method');
```

### Testing Async Code

```typescript
test('handles async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

test('handles errors', async () => {
  await expect(failingAsyncFunction())
    .rejects.toThrow('Expected error');
});
```

## Common Test Patterns

### Testing MCP Handlers

```typescript
test('handler processes request correctly', async () => {
  // Mock dependencies
  vi.mocked(fsUtils.listDirectory).mockResolvedValue([
    { name: 'file.txt', path: '/file.txt', type: 'file' }
  ]);
  
  // Test the underlying logic
  const result = await fsUtils.listDirectory('/root', '.', true, 10);
  
  expect(result).toHaveLength(1);
  expect(result[0].name).toBe('file.txt');
});
```

### Testing Security

```typescript
test('blocks path traversal attempts', () => {
  const maliciousPath = '../../../etc/passwd';
  
  expect(() => 
    normalizeAndValidatePath('/safe/root', maliciousPath)
  ).toThrow('Path traversal detected');
});
```

### Testing Resource Limits

```typescript
test('enforces file size limits', () => {
  const rm = new ResourceManager({ maxFileSize: 1000 });
  
  expect(() => rm.checkFileSize(2000, '/large.txt'))
    .toThrow('exceeds maximum allowed size');
});
```

## Troubleshooting Tests

### Integration Tests Failing

The integration tests may fail in development due to the security check requiring the server to run from node_modules. This is expected behavior.

### Timeout Issues

If tests timeout, increase the timeout in specific tests:

```typescript
test('slow operation', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Mock Reset Issues

Always clear mocks between tests:

```typescript
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules(); // If needed
});
```

## Performance Testing

Run stress tests to verify performance:

```bash
npm test -- src/__tests__/stress.test.ts
```

Key performance benchmarks:
- List 1000 files: < 1 second
- Search large directory: < 2 seconds
- Handle 100 concurrent requests: < 1 second

## Security Testing

Security tests verify:
- Path traversal protection
- Project root isolation
- Input validation
- Resource limits

Run security-specific tests:
```bash
npm test -- src/__tests__/security.test.ts src/__tests__/find-project-root.test.ts
```

## Contributing Tests

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests cover:
   - Happy path
   - Error cases
   - Edge cases
   - Security implications
3. Run full test suite before committing
4. Maintain or improve coverage

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Release builds

Ensure all tests pass before merging!