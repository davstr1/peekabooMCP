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
  // MCP servers always run from node_modules
  const nodeModulesIndex = __dirname.lastIndexOf(`${path.sep}node_modules${path.sep}`);
  
  if (nodeModulesIndex === -1) {
    throw new Error('peekaboo-mcp must be run as an installed npm package');
  }
  
  // Extract project root (everything before node_modules)
  return __dirname.substring(0, nodeModulesIndex);
}
```

This is much simpler because:
- MCP servers are ALWAYS installed via npm
- They ALWAYS run from within node_modules
- The path structure is completely predictable

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

### Simplified Implementation

Since peekaboo-mcp is an npm package that runs as an MCP server, it will ALWAYS be executed from within node_modules. This simplifies our approach:

```typescript
function findProjectRoot(): string {
  // We're always in node_modules when running as MCP
  const nodeModulesIndex = __dirname.lastIndexOf(`${path.sep}node_modules${path.sep}`);
  
  if (nodeModulesIndex === -1) {
    // This should never happen in production
    throw new Error('peekaboo-mcp must be run as an installed npm package');
  }
  
  // Extract project root (everything before node_modules)
  return __dirname.substring(0, nodeModulesIndex);
}
```

### Why This Works

1. **MCP servers are always npm packages** - They're installed and run via package managers
2. **The path structure is predictable** - `/project/node_modules/peekaboo-mcp/dist/index.js`
3. **No edge cases needed** - Global installs aren't relevant for MCP servers

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