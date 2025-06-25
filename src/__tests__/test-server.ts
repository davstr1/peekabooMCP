#!/usr/bin/env node
// Test server wrapper that bypasses findProjectRoot security check
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createPeekabooServer } from '../index.js';
import { ServerConfig } from '../types.js';

async function main() {
  const rootDir = process.cwd(); // Use current directory for testing
  const config: ServerConfig = {
    recursive: process.env.PEEKABOO_RECURSIVE !== 'false',
    maxDepth: process.env.PEEKABOO_MAX_DEPTH ? parseInt(process.env.PEEKABOO_MAX_DEPTH) : 10
  };
  
  const server = createPeekabooServer(rootDir, config);
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error(`Test server started with root: ${rootDir}`);
}

main().catch(error => {
  console.error('Server error:', error);
  process.exit(1);
});