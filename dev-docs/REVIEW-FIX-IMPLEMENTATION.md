# Peekaboo MCP - Implementation Fix Review

## Current State: BROKEN (2/10)
The MCP server fails its primary function - listing resources - due to a critical path bug.

## Root Cause Analysis

### The Bug
**Location**: `src/index.ts:36`
```typescript
const items = await listDirectory(rootDir, '/', serverConfig.recursive, serverConfig.maxDepth);
```

**Problem**: Passing `'/'` as relativePath causes `path.resolve(rootDir, '/')` to resolve to system root `/` instead of the intended `rootDir`, triggering path traversal protection.

**Impact**: Complete failure of `listResources` functionality, making the server unusable for AI clients.

## Actionable Fix Checklist

### 🔲 1. Fix Critical Path Bug (URGENT)
- Change `'/'` to `'.'` in the listDirectory call
- Or pass empty string `''` for root directory
- Test with multiple root directory configurations

### 🔲 2. Improve Path Handling
- Make path resolution more robust for edge cases
- Handle Windows paths correctly (backslash vs forward slash)
- Add comprehensive unit tests for path validation

### 🔲 3. Fix Type Safety Issues
- Replace `any[]` types in flattenItems function
- Create proper recursive type for nested structures
- Enable strict TypeScript mode

### 🔲 4. Enhance Error Handling
- Create custom error classes (PathTraversalError, FileNotFoundError)
- Provide helpful error messages with context
- Include suggested fixes in error responses

### 🔲 5. Add Missing Core Features
- MIME type detection using file extensions
- Support for binary files (images, PDFs)
- File filtering options (by extension, size, date)
- Pagination for large directories

### 🔲 6. Refactor Code Structure
- Extract flattening logic to separate function
- Move business logic out of request handlers
- Create proper service layer

### 🔲 7. Improve Security
- Add rate limiting for requests
- Implement file size limits for reads
- Validate all input parameters
- Add request logging

### 🔲 8. Add Comprehensive Tests
- Unit tests for all utility functions
- Integration tests for MCP protocol
- Test edge cases (symlinks, permissions, large files)
- Add CI/CD pipeline

### 🔲 9. Documentation
- Add JSDoc comments to all functions
- Create API documentation
- Add troubleshooting guide
- Include architecture diagram

### 🔲 10. Performance Optimization
- Cache directory listings
- Stream large files instead of loading to memory
- Add connection pooling
- Implement lazy loading for deep directories

## MVP Priority Order

1. **Fix the path bug** - Without this, nothing works
2. **Add basic tests** - Prevent regression
3. **Improve error messages** - Help users debug
4. **Add MIME types** - Essential for file handling
5. **Basic documentation** - Usage instructions

## Clean Code Principles to Apply

- **DRY**: Extract repeated path handling logic
- **KISS**: Simplify the flatten function
- **YAGNI**: Don't add features until needed
- **Single Responsibility**: Separate concerns properly
- **Meaningful Names**: Rename vague parameters

## Expected Result After Fixes

```typescript
// Test output should show:
📂 LISTING RESOURCES: ✅ Success
Total resources found: 15
  📁 test-files/
  📄 test-files/sample.txt (text/plain)
  📁 test-files/nested/
  📄 test-files/nested/deep.json (application/json)

📄 READING FILE: ✅ Success
Content preview: "This is a sample text file..."

🔧 CAPABILITIES: ✅ Properly defined
{
  "resources": {
    "list": true,
    "read": true,
    "subscribe": false
  }
}
```

## Summary

The implementation is currently broken due to a simple but critical bug. Once fixed, the codebase needs significant improvements in type safety, error handling, and features to be production-ready. The MVP focus should be on making it work reliably first, then improving code quality.