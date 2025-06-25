#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { listDirectory, readFileContent, normalizeAndValidatePath } from './fs-utils.js';
import { ServerConfig, FileSystemItem } from './types.js';
import { getMimeType } from './mime-types.js';
import { searchByPath, searchContent } from './search-utils.js';
import { ResourceManager } from './resource-manager.js';
import { createLogger } from './logger.js';
import { MetricsCollector } from './metrics.js';
import * as path from 'path';

/**
 * Automatically detects the project root by finding the parent directory
 * of node_modules. This ensures the MCP server only accesses files within
 * the project where it's installed, preventing security vulnerabilities.
 * 
 * @returns The absolute path to the project root
 * @throws Error if not running from within node_modules
 */
export function findProjectRoot(): string {
  // MCP servers always run from node_modules when properly installed
  const nodeModulesIndex = __dirname.lastIndexOf(`${path.sep}node_modules${path.sep}`);
  
  if (nodeModulesIndex === -1) {
    throw new Error(
      'peekaboo-mcp must be run as an installed npm package. ' +
      'Direct execution is not supported for security reasons.'
    );
  }
  
  // Extract project root (everything before node_modules)
  return __dirname.substring(0, nodeModulesIndex);
}

const DEFAULT_CONFIG: ServerConfig = {
  recursive: true,
  maxDepth: 10,
  timeout: 30000, // 30 seconds default timeout
  maxFileSize: 10 * 1024 * 1024, // 10MB default max file size
  maxTotalSize: 100 * 1024 * 1024 // 100MB default max total size
};

const serverStartTime = Date.now();

export function createPeekabooServer(rootDir: string, config: ServerConfig = DEFAULT_CONFIG) {
  const serverConfig = { ...DEFAULT_CONFIG, ...config };
  const metrics = new MetricsCollector();
  
  // Create resource manager with configured limits
  const resourceManager = new ResourceManager({
    timeout: serverConfig.timeout,
    maxFileSize: serverConfig.maxFileSize,
    maxTotalSize: serverConfig.maxTotalSize
  });
  
  const server = new Server(
    {
      name: 'peekaboo-mcp',
      version: '2.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {}
      }
    }
  );

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const metric = metrics.startOperation('list_resources');
    try {
      // Reset size tracking for new request
      resourceManager.resetSize();
      
      const listOperation = listDirectory(
        rootDir, 
        '.', 
        serverConfig.recursive, 
        serverConfig.maxDepth,
        0,
        resourceManager
      );
      
      const items = await resourceManager.withTimeout(
        listOperation,
        'listDirectory'
      );
      
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
      
      const result = {
        resources: flattenItems(items)
      };
      
      metrics.endOperation(metric, true);
      return result;
    } catch (error) {
      metrics.endOperation(metric, false, error instanceof Error ? error.message : 'Unknown error');
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
      
      const readOperation = readFileContent(validPath, resourceManager);
      const content = await resourceManager.withTimeout(
        readOperation,
        'readFileContent'
      );
      
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

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'search_path',
          description: 'Search for files and directories by name pattern',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
                description: 'Search pattern (supports * and ** wildcards, e.g., "*.js", "**/test/*.json")'
              }
            },
            required: ['pattern']
          }
        },
        {
          name: 'search_content',
          description: 'Search for content within files',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Text to search for in file contents'
              },
              include: {
                type: 'string',
                description: 'Optional file pattern to search in (e.g., "*.js", "*.md")'
              },
              ignoreCase: {
                type: 'boolean',
                description: 'Case-insensitive search (default: true)'
              }
            },
            required: ['query']
          }
        },
        {
          name: 'health_check',
          description: 'Get server health status and metrics',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === 'search_path') {
        const pattern = args?.pattern as string;
        if (!pattern) {
          throw new McpError(ErrorCode.InvalidRequest, 'Pattern is required');
        }

        const searchOperation = searchByPath(rootDir, pattern);
        const paths = await resourceManager.withTimeout(
          searchOperation,
          'searchByPath'
        );
        
        return {
          content: [
            {
              type: 'text',
              text: paths.length > 0 
                ? `Found ${paths.length} matches:\n${paths.join('\n')}`
                : 'No files found matching the pattern'
            }
          ]
        };
      }

      if (name === 'search_content') {
        const query = args?.query as string;
        if (!query) {
          throw new McpError(ErrorCode.InvalidRequest, 'Query is required');
        }

        const searchOperation = searchContent(rootDir, query, {
          include: args?.include as string,
          ignoreCase: args?.ignoreCase !== false,
          maxResults: 20
        });
        
        const results = await resourceManager.withTimeout(
          searchOperation,
          'searchContent'
        );

        if (results.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: 'No matches found'
              }
            ]
          };
        }

        let output = `Found matches in ${results.length} files:\n\n`;
        for (const result of results) {
          output += `📄 ${result.path}\n`;
          if (result.matches) {
            for (const match of result.matches) {
              output += `  Line ${match.line}: ${match.content}\n`;
            }
          }
          output += '\n';
        }

        return {
          content: [
            {
              type: 'text',
              text: output
            }
          ]
        };
      }
      
      if (name === 'health_check') {
        const uptime = Date.now() - serverStartTime;
        const metricsData = metrics.getMetrics();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                status: 'healthy',
                version: '2.0.0',
                uptime: uptime,
                uptimeHuman: `${Math.floor(uptime / 1000)}s`,
                metrics: metricsData.summary,
                config: {
                  rootDir,
                  recursive: serverConfig.recursive,
                  maxDepth: serverConfig.maxDepth,
                  timeout: serverConfig.timeout,
                  maxFileSize: serverConfig.maxFileSize,
                  maxTotalSize: serverConfig.maxTotalSize
                }
              }, null, 2)
            }
          ]
        };
      }

      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    } catch (error) {
      if (error instanceof McpError) throw error;
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  return server;
}

async function main() {
  const logger = createLogger('peekaboo-mcp');
  
  try {
    const rootDir = findProjectRoot();
    const config: ServerConfig = {
      recursive: process.env.PEEKABOO_RECURSIVE !== 'false',
      maxDepth: process.env.PEEKABOO_MAX_DEPTH ? parseInt(process.env.PEEKABOO_MAX_DEPTH) : 10
    };
    
    const server = createPeekabooServer(rootDir, config);
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    logger.info(`Peekaboo MCP server started with root: ${rootDir} (recursive: ${config.recursive}, maxDepth: ${config.maxDepth})`);
  } catch (error) {
    logger.error('Failed to start server:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  const logger = createLogger('peekaboo-mcp');
  main().catch(error => {
    logger.error('Server error:', error);
    process.exit(1);
  });
}