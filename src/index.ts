#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { listDirectory, readFileContent, normalizeAndValidatePath } from './fs-utils.js';

const DEFAULT_ROOT = process.cwd();

export function createPeekabooServer(rootDir: string = DEFAULT_ROOT) {
  const server = new Server(
    {
      name: 'peekaboo-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {}
      }
    }
  );

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
      const items = await listDirectory(rootDir, '/');
      return {
        resources: items.map(item => ({
          uri: `file://${item.path}`,
          name: item.name,
          mimeType: item.type === 'file' ? 'text/plain' : 'inode/directory'
        }))
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list resources: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    if (!uri.startsWith('file://')) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Only file:// URIs are supported'
      );
    }

    const requestedPath = uri.slice(7);
    
    try {
      const validPath = normalizeAndValidatePath(rootDir, requestedPath);
      const content = await readFileContent(validPath);
      
      return {
        contents: [{
          uri: request.params.uri,
          mimeType: 'text/plain',
          text: content
        }]
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('outside root')) {
        throw new McpError(
          ErrorCode.PermissionDenied,
          'Access denied: Path traversal attempt detected'
        );
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  return server;
}

async function main() {
  const rootDir = process.env.PEEKABOO_ROOT || DEFAULT_ROOT;
  const server = createPeekabooServer(rootDir);
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error(`Peekaboo MCP server started with root: ${rootDir}`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}