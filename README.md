# peekaboo-mcp

Minimal Model Context Protocol (MCP) server for read-only file system access.

## Features

- List directory contents recursively by default
- Read file contents
- Strict read-only access (no write/edit/delete operations)
- Path traversal protection
- Automatic project root detection (accesses only the project where installed)
- Configurable recursion depth

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
  recursive: false,  // Disable recursive listing
  maxDepth: 5       // Limit recursion depth
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

The server exposes two MCP resources:

1. **List Resources**: Returns all files and directories from the root (recursive by default)
2. **Read Resource**: Returns the content of a specific file

Resources are accessed via `file://` URIs relative to the configured root.

## Configuration

Environment variables:
- `PEEKABOO_RECURSIVE`: Enable recursive listing (default: true, set to 'false' to disable)
- `PEEKABOO_MAX_DEPTH`: Maximum recursion depth (default: 10)

The root directory is automatically detected based on where peekaboo-mcp is installed and cannot be overridden.