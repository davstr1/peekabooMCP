# Troubleshooting Guide

## Common Issues and Solutions

### Error: "peekaboo-mcp must be run as an installed npm package"

**Cause**: You're trying to run the server directly instead of through npm.

**Solution**: Install the package properly:
```bash
npm install peekaboo-mcp
npx peekaboo-mcp
```

### Error: "Path traversal detected"

**Cause**: The requested path tries to access files outside the project root.

**Solution**: Ensure all file paths are relative to the project root and don't contain `..` sequences.

### Error: "File size exceeds maximum allowed size"

**Cause**: Trying to read a file larger than the configured limit (default 10MB).

**Solution**: 
- Check if you really need to read such large files
- Increase the limit if necessary:
  ```typescript
  const server = createPeekabooServer(rootDir, {
    maxFileSize: 20 * 1024 * 1024 // 20MB
  });
  ```

### Error: "Operation timed out"

**Cause**: An operation took longer than the configured timeout (default 30s).

**Solution**:
- Check if you're searching a very large directory structure
- Increase the timeout if necessary:
  ```typescript
  const server = createPeekabooServer(rootDir, {
    timeout: 60000 // 60 seconds
  });
  ```

### Integration Test Failures

**Cause**: The integration tests fail in development due to security restrictions.

**Solution**: This is expected behavior. The integration tests will pass when the package is properly installed via npm.

### No Coverage Reports Generated

**Cause**: Coverage directory not being created.

**Solution**: 
```bash
npm run test:coverage
```

### Server Won't Start

**Possible Causes**:
1. Port already in use
2. Missing dependencies
3. TypeScript compilation errors

**Solutions**:
1. Check if another process is using the port
2. Run `npm install`
3. Run `npm run build` and fix any errors

## Error Codes Reference

| Code | Description | Solution |
|------|-------------|----------|
| 1001 | Path traversal detected | Use relative paths without `..` |
| 1002 | Unauthorized access | Check file permissions |
| 1003 | Not in node_modules | Install via npm |
| 2001 | File not found | Verify file exists |
| 2002 | Directory not found | Verify directory exists |
| 2005 | Permission denied | Check file permissions |
| 3001 | File too large | Increase maxFileSize limit |
| 3002 | Total size exceeded | Increase maxTotalSize limit |
| 3003 | Operation timeout | Increase timeout limit |
| 4001 | Invalid URI | Use file:// URIs only |
| 4002 | Unknown tool | Use 'search_path' or 'search_content' |
| 4003 | Missing parameter | Check required parameters |

## Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npx peekaboo-mcp
```

## Getting Help

If you're still having issues:

1. Check the [documentation](../README.md)
2. Search [existing issues](https://github.com/davstr1/peekabooMCP/issues)
3. Create a new issue with:
   - Error message and code
   - Steps to reproduce
   - Environment details (OS, Node version)
   - Relevant configuration