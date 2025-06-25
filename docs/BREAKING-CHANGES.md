# Breaking Changes Migration Guide

## Version 2.0.0

### Removed PEEKABOO_ROOT Environment Variable

**What changed**: The `PEEKABOO_ROOT` environment variable has been removed for security reasons.

**Why**: To prevent LLMs or malicious actors from manipulating the root directory and accessing files outside the intended project scope.

**Migration**:

Before:
```bash
PEEKABOO_ROOT=/custom/path npx peekaboo-mcp
```

After:
```bash
# Root is automatically detected - no configuration needed
npx peekaboo-mcp
```

If you were using custom root paths:
1. Install peekaboo-mcp in the project you want to access
2. The server will automatically use that project's root
3. For programmatic usage, use `findProjectRoot()`:

```typescript
import { createPeekabooServer, findProjectRoot } from 'peekaboo-mcp';

// Automatic detection
const rootDir = findProjectRoot();
const server = createPeekabooServer(rootDir);
```

### Direct Execution No Longer Supported

**What changed**: peekaboo-mcp must be run as an installed npm package.

**Why**: Security enhancement to ensure the server only accesses the project where it's installed.

**Migration**:

Before:
```bash
node /path/to/peekaboo-mcp/dist/index.js
```

After:
```bash
# Install first
npm install peekaboo-mcp

# Then run
npx peekaboo-mcp
```

### New Required Parameters for fs-utils Functions

**What changed**: `listDirectory` and `readFileContent` now accept optional `ResourceManager` parameter.

**Why**: To support timeouts and resource limits.

**Migration**:

Before:
```typescript
const items = await listDirectory(root, path, recursive, maxDepth);
const content = await readFileContent(filePath);
```

After:
```typescript
// Without resource limits (backward compatible)
const items = await listDirectory(root, path, recursive, maxDepth);
const content = await readFileContent(filePath);

// With resource limits
const rm = new ResourceManager({ timeout: 30000, maxFileSize: 10485760 });
const items = await listDirectory(root, path, recursive, maxDepth, 0, rm);
const content = await readFileContent(filePath, rm);
```

## Non-Breaking Additions

### New Configuration Options

The `ServerConfig` interface now supports additional optional properties:

```typescript
interface ServerConfig {
  recursive?: boolean;      // Existing
  maxDepth?: number;       // Existing
  timeout?: number;        // New: Operation timeout in ms
  maxFileSize?: number;    // New: Max file size in bytes
  maxTotalSize?: number;   // New: Max total size for listings in bytes
}
```

### New Search Tools

Two new MCP tools are available:
- `search_path`: Search for files by name pattern
- `search_content`: Search for content within files

These are automatically available to MCP clients without any configuration changes.

## Recommendations

1. **Update your installation**: Remove any hardcoded paths and use npm installation
2. **Review security**: The new automatic root detection enhances security
3. **Configure limits**: Consider setting appropriate resource limits for your use case
4. **Test thoroughly**: Run your integration tests to ensure compatibility