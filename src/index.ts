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
import { ServerConfig, FileSystemItem } from './types.js';
import { getMimeType } from './mime-types.js';

const DEFAULT_ROOT = process.cwd();
const DEFAULT_CONFIG: ServerConfig = {
  recursive: true,
  maxDepth: 10
};

export function createPeekabooServer(rootDir: string = DEFAULT_ROOT, config: ServerConfig = DEFAULT_CONFIG) {
  const serverConfig = { ...DEFAULT_CONFIG, ...config };
  
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
      const items = await listDirectory(rootDir, '.', serverConfig.recursive, serverConfig.maxDepth);
      
      // Flatten the recursive structure for MCP resources
      const flattenItems = (items: FileSystemItem[], result: any[] = []): any[] => {
        for (const item of items) {
          const fullPath = `${rootDir}${item.path}`;
          result.push({
            uri: `file://${fullPath}`,
            name: item.path,
            mimeType: item.type === 'file' ? getMimeType(item.name) : 'inode/directory',
            metadata: {
              type: item.type,
              size: item.size,
              hasChildren: item.children && item.children.length > 0
            }
          });
          if (item.children) {
            flattenItems(item.children, result);
          }
        }
        return result;
      };
      
      return {
        resources: flattenItems(items)
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
          mimeType: getMimeType(validPath),
          text: content
        }]
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('outside root')) {
        throw new McpError(
          ErrorCode.InvalidRequest,
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
  const config: ServerConfig = {
    recursive: process.env.PEEKABOO_RECURSIVE !== 'false',
    maxDepth: process.env.PEEKABOO_MAX_DEPTH ? parseInt(process.env.PEEKABOO_MAX_DEPTH) : 10
  };
  
  const server = createPeekabooServer(rootDir, config);
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  console.error(`Peekaboo MCP server started with root: ${rootDir} (recursive: ${config.recursive}, maxDepth: ${config.maxDepth})`);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}