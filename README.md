# peekaboo-mcp

Minimal Model Context Protocol (MCP) server for read-only file system access.

## The Problem

Claude Code (or any AI coding agent) often makes broader changes than intended. You ask it to fix a simple bug, and it refactors half your codebase. This happens because Claude Code has full read/write access to everything in your project directory.

## The Solution

Peekaboo-mcp lets you isolate what Claude Code (or any AI agent) can modify while still giving it visibility into your entire codebase. Simply:
1. Open your editor in a small, dedicated workspace folder
2. Let peekaboo-mcp provide read-only access to your actual project.

Now Claude Code can see all the context it needs but can only modify files in your controlled workspace.

## Quick Start

1. **Install peekaboo-mcp in your project root:**
   ```bash
   cd /path/to/your/project
   npm install peekaboo-mcp
   ```

2. **Configure your AI tool:**

   **For Claude Desktop:**
   Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (Mac):
   ```json
   {
     "mcpServers": {
       "peekaboo": {
         "command": "npx",
         "args": ["peekaboo-mcp"],
         "cwd": "/path/to/your/project"
       }
     }
   }
   ```

   **For Cursor.AI:**
   Add to `.cursorrules` in your workspace folder:
   ```
   Use the peekaboo-mcp server at /path/to/your/project for read-only access to the entire codebase.
   Only modify files in the current workspace.
   ```
   
   Then configure MCP in Cursor settings to run:
   ```bash
   cd /path/to/your/project && npx peekaboo-mcp
   ```

3. **Open ONLY the folder you want AI to work on:**
   
   Instead of opening your entire project, open just the specific folder you want modified:
   ```bash
   # Example: You want AI to work on your React components
   cursor /path/to/your/project/src/components
   
   # Or: You want AI to refactor your API routes
   cursor /path/to/your/project/api/routes
   ```

   **Result:** The AI can now:
   - ✅ Read your ENTIRE project (understands full context)
   - ✅ Only modify files in `/src/components` (or whatever folder you opened)
   - ❌ Cannot touch files outside the opened folder

## Features

- List directory contents recursively by default
- Read file contents with MIME type detection
- Search files by name pattern (glob support)
- Search content within files
- Strict read-only access (no write/edit/delete operations)
- Path traversal protection
- Automatic project root detection (accesses only the project where installed)
- Configurable recursion depth
- Resource management (timeouts, file size limits)
- Comprehensive test coverage

## Installation

```bash
npm install peekaboo-mcp
```

## Usage

### As a standalone server

```bash
# Run from your project (automatically detects project root)
npx peekaboo-mcp

# Disable recursive listing
PEEKABOO_RECURSIVE=false npx peekaboo-mcp

# Set custom max depth (default: 10)
PEEKABOO_MAX_DEPTH=5 npx peekaboo-mcp
```

**Note**: peekaboo-mcp automatically detects and uses the project root where it's installed. It cannot access files outside of this project for security reasons.

### As a module

```typescript
import { createPeekabooServer, findProjectRoot } from 'peekaboo-mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Automatically detect project root
const rootDir = findProjectRoot();

// Default: recursive listing enabled, max depth 10
const server = createPeekabooServer(rootDir);

// Or with custom config
const server = createPeekabooServer(rootDir, {
  recursive: false,     // Disable recursive listing
  maxDepth: 5,         // Limit recursion depth
  timeout: 60000,      // 60 second timeout (default: 30s)
  maxFileSize: 5 * 1024 * 1024,  // 5MB max file size (default: 10MB)
  maxTotalSize: 50 * 1024 * 1024 // 50MB max total size (default: 100MB)
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "peekaboo": {
      "command": "npx",
      "args": ["peekaboo-mcp"]
    }
  }
}
```

## Security

- All file access is strictly read-only
- Automatic project root detection prevents access outside the installed project
- Path traversal above the project root is blocked
- No write, edit, or delete operations are supported
- No user-configurable root directory (prevents manipulation by LLMs or malicious actors)

## API

### Resources

1. **List Resources**: Returns all files and directories from the root (recursive by default)
2. **Read Resource**: Returns the content of a specific file

Resources are accessed via `file://` URIs relative to the configured root.

### Tools

1. **search_path**: Search for files and directories by name pattern
   - Supports wildcards: `*` (any characters), `**` (any directories), `?` (single character)
   - Examples: `*.ts`, `src/**/*.js`, `test-?.md`

2. **search_content**: Search for content within files
   - Optional file pattern filter
   - Case-insensitive by default
   - Returns matching lines with line numbers

## Configuration

Environment variables:
- `PEEKABOO_RECURSIVE`: Enable recursive listing (default: true, set to 'false' to disable)
- `PEEKABOO_MAX_DEPTH`: Maximum recursion depth (default: 10)

The root directory is automatically detected based on where peekaboo-mcp is installed and cannot be overridden.

## Resource Limits

Default limits (configurable via ServerConfig):
- **Timeout**: 30 seconds per operation
- **Max file size**: 10MB per file
- **Max total size**: 100MB for directory listings

Operations that exceed these limits will fail with appropriate error messages.

## Testing

Run the test suite:

```bash
npm test
```

See [docs/TESTING.md](docs/TESTING.md) for detailed testing information.

## Example Client

See [examples/test-client.js](examples/test-client.js) for a complete example of using peekaboo-mcp with the MCP SDK.

## Documentation

- [Testing Guide](docs/TESTING.md) - How to run and write tests
- [MCP Response Reference](docs/MCP-RESPONSES.md) - Expected server responses
- [Example Client](examples/test-client.js) - Working client implementation
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Contributing](CONTRIBUTING.md) - Development guide

## FAQ

**Q: Can I access files outside my project?**  
A: No, for security reasons peekaboo-mcp only accesses files within the project where it's installed.

**Q: How do I search for files?**  
A: Use the `search_path` tool with glob patterns like `*.js` or `src/**/*.ts`.

**Q: What file types are supported?**  
A: All text files are supported. Binary files are detected but content reading may be limited.

**Q: How do I increase file size limits?**  
A: Configure the server with custom limits - see the API section above.