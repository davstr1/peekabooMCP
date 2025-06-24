# peekaboo-mcp

Minimal Model Context Protocol (MCP) server for read-only file system access.

## Features

- List directory contents with type info
- Read file contents
- Strict read-only access (no write/edit/delete operations)
- Path traversal protection
- Configurable root directory

## Installation

```bash
npm install peekaboo-mcp
```

## Usage

### As a standalone server

```bash
# Use current directory as root
npx peekaboo-mcp

# Use custom root directory
PEEKABOO_ROOT=/path/to/allowed/directory npx peekaboo-mcp
```

### As a module

```typescript
import { createPeekabooServer } from 'peekaboo-mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = createPeekabooServer('/path/to/root');
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
      "args": ["peekaboo-mcp"],
      "env": {
        "PEEKABOO_ROOT": "/path/to/allowed/directory"
      }
    }
  }
}
```

## Security

- All file access is strictly read-only
- Path traversal above the configured root is blocked
- No write, edit, or delete operations are supported

## API

The server exposes two MCP resources:

1. **List Resources**: Returns all files and directories from the root
2. **Read Resource**: Returns the content of a specific file

Resources are accessed via `file://` URIs relative to the configured root.