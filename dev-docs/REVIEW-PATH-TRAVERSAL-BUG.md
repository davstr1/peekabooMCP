# Peekaboo-MCP Code Review - Path Traversal Bug & General Issues

## Executive Summary
The peekaboo-mcp server has a critical path traversal bug in `listDirectory()` that causes the `listResources` handler to fail. Additionally, there are several code structure, error handling, and implementation issues that need addressing.

## Critical Issue: Path Traversal Bug

### Root Cause
In `src/index.ts` line 36, when calling `listDirectory()`:
```typescript
const items = await listDirectory(rootDir, '/', serverConfig.recursive, serverConfig.maxDepth);
```

The second parameter `'/'` is passed as the relative path. However, in `fs-utils.ts`, the `normalizeAndValidatePath()` function tries to resolve this:
```typescript
const resolvedPath = path.resolve(normalizedRoot, requestedPath);
```

When `requestedPath` is `'/'`, this resolves to the system root directory, not the `rootDir`. This causes the path traversal check to fail because the system root doesn't start with the configured `rootDir`.

## Actionable Checklist

### 1. Critical Bug Fixes
- [ ] Fix path traversal bug in `listDirectory()` call - change `'/'` to `'.'` or empty string
- [ ] Update `normalizeAndValidatePath()` to handle root directory requests properly
- [ ] Add proper handling for empty string paths in path validation

### 2. Error Handling Improvements
- [ ] Add more specific error types instead of generic Error throws
- [ ] Improve error messages to be more descriptive for debugging
- [ ] Add proper logging for debugging (currently only console.error on startup)
- [ ] Handle edge cases like symlinks, special files, and permission errors more gracefully

### 3. Code Structure & Organization
- [ ] Move flattening logic out of the request handler into a separate utility function
- [ ] Create constants for magic strings like 'file://', 'text/plain', 'inode/directory'
- [ ] Add JSDoc comments for all exported functions
- [ ] Consider creating a separate class for the file system operations

### 4. Type Safety & Validation
- [ ] Remove `any` types in `flattenItems` function (lines 39, 39 in index.ts)
- [ ] Add input validation for environment variables (check for NaN in maxDepth)
- [ ] Add validation for ServerConfig values (e.g., maxDepth should be positive)
- [ ] Use stricter typing for error handling

### 5. Missing Features
- [ ] Add file extension to MIME type mapping (currently all files are 'text/plain')
- [ ] Add support for binary file detection
- [ ] Add file filtering options (e.g., ignore patterns)
- [ ] Add sorting options for directory listings
- [ ] Consider adding pagination for large directories

### 6. Performance & Scalability
- [ ] Add caching for directory listings to avoid repeated file system calls
- [ ] Consider streaming large file contents instead of loading all at once
- [ ] Add limits on file size for reading (prevent OOM on large files)
- [ ] Optimize recursive directory traversal for large file trees

### 7. Security Enhancements
- [ ] Add rate limiting to prevent abuse
- [ ] Add file size limits for reading
- [ ] Consider adding allowed/denied file patterns
- [ ] Validate and sanitize all inputs more thoroughly

### 8. Testing & Documentation
- [ ] Add unit tests for all utility functions
- [ ] Add integration tests for MCP protocol handling
- [ ] Create proper README with usage examples
- [ ] Document environment variables and their defaults
- [ ] Add error scenarios to test suite

### 9. Build & Distribution
- [ ] Add proper shebang handling for the built version
- [ ] Consider adding a CLI wrapper for easier usage
- [ ] Add proper npm scripts for linting and formatting
- [ ] Configure ESLint and Prettier

### 10. Compatibility & Standards
- [ ] Ensure Windows path compatibility (currently uses Unix-style paths)
- [ ] Add proper cross-platform path handling
- [ ] Consider using `node:path` imports for better compatibility
- [ ] Update to use ES modules fully (currently mixing require.main check)

## Immediate Priority Actions
1. Fix the path traversal bug - this is blocking all functionality
2. Remove `any` types for better type safety
3. Add proper error handling and logging
4. Add basic tests to prevent regression

## Code Quality Score: 5/10
- Functionality: 2/10 (critical bug prevents main feature from working)
- Code Structure: 6/10 (decent separation of concerns)
- Error Handling: 4/10 (basic but needs improvement)
- Type Safety: 6/10 (mostly typed but has `any` usage)
- Documentation: 3/10 (minimal comments, no JSDoc)