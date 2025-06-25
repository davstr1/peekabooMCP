# MCP Protocol Responses

This document describes the expected responses from the peekaboo-mcp server for each MCP method.

## Server Information

When connecting, the server provides:

```json
{
  "name": "peekaboo-mcp",
  "version": "1.0.0",
  "capabilities": {
    "resources": {},
    "tools": {}
  }
}
```

## resources/list

Lists all files and directories in the project.

### Request
```json
{
  "method": "resources/list",
  "params": {}
}
```

### Response
```json
{
  "resources": [
    {
      "uri": "file:///project/src/index.ts",
      "name": "/src/index.ts",
      "mimeType": "text/typescript",
      "metadata": {
        "type": "file",
        "size": 1234,
        "hasChildren": false
      }
    },
    {
      "uri": "file:///project/src",
      "name": "/src",
      "mimeType": "inode/directory",
      "metadata": {
        "type": "directory",
        "hasChildren": true
      }
    }
  ]
}
```

## resources/read

Reads the content of a specific file.

### Request
```json
{
  "method": "resources/read",
  "params": {
    "uri": "file:///project/src/index.ts"
  }
}
```

### Response
```json
{
  "contents": [
    {
      "uri": "file:///project/src/index.ts",
      "mimeType": "text/typescript",
      "text": "// File contents here\nimport { ... }"
    }
  ]
}
```

### Error Cases

#### Invalid URI Format
```json
{
  "error": {
    "code": -32600,
    "message": "Only file:// URIs are supported"
  }
}
```

#### Path Traversal Attempt
```json
{
  "error": {
    "code": -32600,
    "message": "Access denied: Path traversal attempt detected"
  }
}
```

#### File Not Found
```json
{
  "error": {
    "code": -32001,
    "message": "Failed to read file: File not found: /nonexistent.txt"
  }
}
```

#### File Too Large
```json
{
  "error": {
    "code": -32600,
    "message": "File '/large.bin' size (15728640 bytes) exceeds maximum allowed size (10485760 bytes)"
  }
}
```

## tools/list

Lists available search tools.

### Request
```json
{
  "method": "tools/list",
  "params": {}
}
```

### Response
```json
{
  "tools": [
    {
      "name": "search_path",
      "description": "Search for files and directories by name pattern",
      "inputSchema": {
        "type": "object",
        "properties": {
          "pattern": {
            "type": "string",
            "description": "Search pattern (supports * and ** wildcards, e.g., \"*.js\", \"**/test/*.json\")"
          }
        },
        "required": ["pattern"]
      }
    },
    {
      "name": "search_content",
      "description": "Search for content within files",
      "inputSchema": {
        "type": "object",
        "properties": {
          "query": {
            "type": "string",
            "description": "Text to search for in file contents"
          },
          "include": {
            "type": "string",
            "description": "Optional file pattern to search in (e.g., \"*.js\", \"*.md\")"
          },
          "ignoreCase": {
            "type": "boolean",
            "description": "Case-insensitive search (default: true)"
          }
        },
        "required": ["query"]
      }
    }
  ]
}
```

## tools/call - search_path

Search for files by name pattern.

### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_path",
    "arguments": {
      "pattern": "*.ts"
    }
  }
}
```

### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found 3 matches:\n/src/index.ts\n/src/types.ts\n/test/example.ts"
    }
  ]
}
```

### No Matches
```json
{
  "content": [
    {
      "type": "text",
      "text": "No files found matching the pattern"
    }
  ]
}
```

## tools/call - search_content

Search for content within files.

### Request
```json
{
  "method": "tools/call",
  "params": {
    "name": "search_content",
    "arguments": {
      "query": "TODO",
      "include": "*.ts",
      "ignoreCase": true
    }
  }
}
```

### Response
```json
{
  "content": [
    {
      "type": "text",
      "text": "Found matches in 2 files:\n\n📄 /src/index.ts\n  Line 42: // TODO: implement feature\n  Line 89: /* TODO: refactor this */\n\n📄 /test/example.ts\n  Line 15: // todo: add more tests\n"
    }
  ]
}
```

### No Matches
```json
{
  "content": [
    {
      "type": "text",
      "text": "No matches found"
    }
  ]
}
```

## Error Responses

### Unknown Tool
```json
{
  "error": {
    "code": -32601,
    "message": "Unknown tool: invalid_tool"
  }
}
```

### Missing Required Parameter
```json
{
  "error": {
    "code": -32600,
    "message": "Pattern is required"
  }
}
```

### Operation Timeout
```json
{
  "error": {
    "code": -32001,
    "message": "Operation 'searchContent' timed out after 30000ms"
  }
}
```

### Resource Limit Exceeded
```json
{
  "error": {
    "code": -32600,
    "message": "Total size (104857600 bytes) exceeds maximum allowed size (104857600 bytes)"
  }
}
```

## Configuration via Environment

The server respects these environment variables:

- `PEEKABOO_RECURSIVE` - Enable recursive directory listing (default: true)
- `PEEKABOO_MAX_DEPTH` - Maximum directory depth (default: 10)

## Notes

1. All file paths in responses are relative to the project root
2. File URIs use the `file://` protocol
3. Binary files return appropriate MIME types but may have limited content
4. The server automatically excludes `node_modules` and build directories
5. Search results are limited to prevent overwhelming responses
6. All operations have configurable timeouts (default: 30 seconds)