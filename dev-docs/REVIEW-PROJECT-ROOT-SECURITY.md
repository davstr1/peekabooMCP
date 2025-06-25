# REVIEW: Project Root Auto-Detection Security

## Current Security Issue

The current implementation allows `PEEKABOO_ROOT` to be configured via environment variable (line 238):
```typescript
const rootDir = process.env.PEEKABOO_ROOT || DEFAULT_ROOT;
```

**This is a security vulnerability** because:
- LLMs using the MCP could set `PEEKABOO_ROOT` to access files outside the project
- Users could accidentally expose sensitive directories
- No validation that the root is actually the project where peekaboo-mcp is installed

## Proposed Solution: Auto-Detect Project Root

### Implementation Strategy

Remove configurable `PEEKABOO_ROOT` and automatically detect the project root:

```typescript
function findProjectRoot(): string {
  let currentDir = __dirname;
  
  // If running from node_modules, go up to project root
  const nodeModulesIndex = currentDir.lastIndexOf(`${path.sep}node_modules${path.sep}`);
  if (nodeModulesIndex !== -1) {
    // Extract everything before node_modules
    currentDir = currentDir.substring(0, nodeModulesIndex);
  }
  
  // Verify we found a valid project root
  const packageJsonPath = path.join(currentDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      // Don't use our own package.json
      if (pkg.name !== 'peekaboo-mcp') {
        return currentDir;
      }
    } catch {
      // If can't read package.json, still use this directory
    }
  }
  
  // Fallback to current working directory
  return process.cwd();
}
```

### Security Benefits

1. **No Configuration = No Manipulation**
   - Removes ability for LLMs or users to set arbitrary paths
   - Always constrained to the project that installed peekaboo-mcp

2. **Automatic Boundary Detection**
   - Uses node_modules structure to find project boundary
   - Validates with package.json presence

3. **Safe Fallbacks**
   - Falls back to `process.cwd()` for direct execution
   - Never allows access outside detected project root

### Edge Cases Handled

1. **Global Installation**
   - Falls back to current working directory
   - Still secure - only accesses where user is working

2. **Monorepo/Workspaces**
   - Finds nearest package.json above node_modules
   - Correctly scopes to the specific package

3. **Direct Execution (Development)**
   - When not in node_modules, uses current directory
   - Allows testing without installation

### Implementation Checklist

- [ ] Remove `PEEKABOO_ROOT` environment variable support
- [ ] Implement `findProjectRoot()` function
- [ ] Update main() to use auto-detected root
- [ ] Add unit tests for root detection logic
- [ ] Test with various installation scenarios
- [ ] Update documentation to remove configuration options
- [ ] Add clear error messages if root detection fails

### Breaking Change Notice

This is a **breaking change** that improves security:
- Users can no longer configure custom root directories
- The tool will only work within the project where it's installed
- This is intentional to prevent security vulnerabilities

### Alternative for Advanced Users

If advanced users need custom paths, they should:
1. Fork the project
2. Modify the code directly
3. Take responsibility for security implications

This keeps the default installation secure while allowing customization for those who understand the risks.