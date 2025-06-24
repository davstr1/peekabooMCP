Scaffold a new Node.js module in TypeScript called peekaboo-mcp.

It should implement a minimal Model Context Protocol (MCP) server using the canonical node MCP module if available (e.g., @modular-ai/mcp).

Expose two main read-only capabilities:

List directory contents: Given a path, list all files and subfolders, with type info, relative to a configured root directory.

Read file content: Given a file path (within allowed tree), return its contents.

All access must be read-only; block all attempts to write, edit, or delete.

Enforce that no path traversal above the configured root is possible.

Use TypeScript, and structure as a reusable Node module (export core logic).

Provide a minimal README and example usage for other MCP-aware systems or LLM agents.

Output only the code and minimal supporting files (package.json, tsconfig.json, etc.).

Don’t include unnecessary boilerplate—focus on the core MCP implementation.

