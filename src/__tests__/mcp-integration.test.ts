import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('MCP Integration Tests', () => {
  let tempDir: string;
  let serverProcess: ChildProcess;
  let client: Client;
  
  beforeEach(async () => {
    // Create temporary test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'peekaboo-test-'));
    
    // Create some test files
    await fs.writeFile(path.join(tempDir, 'test.txt'), 'Hello, world!');
    await fs.mkdir(path.join(tempDir, 'src'));
    await fs.writeFile(path.join(tempDir, 'src', 'index.ts'), 'export function main() {}');
  });
  
  afterEach(async () => {
    // Cleanup
    if (client) {
      await client.close();
    }
    if (serverProcess) {
      serverProcess.kill();
    }
    await fs.rm(tempDir, { recursive: true, force: true });
  });
  
  test('client can connect to server and list resources', async () => {
    // Create client with test server
    const transport = new StdioClientTransport({
      command: 'tsx',
      args: [path.join(__dirname, 'test-server.ts')],
      env: {
        ...process.env,
        PEEKABOO_RECURSIVE: 'true',
        PEEKABOO_MAX_DEPTH: '5'
      },
      cwd: tempDir
    });
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    // Connect
    await client.connect(transport);
    
    // List resources
    const resources = await client.request({
      method: 'resources/list',
      params: {}
    });
    
    expect(resources).toBeDefined();
    expect(resources.resources).toBeInstanceOf(Array);
    expect(resources.resources.some((r: any) => r.name.includes('test.txt'))).toBe(true);
    expect(resources.resources.some((r: any) => r.name.includes('src'))).toBe(true);
  });
  
  test('client can read file content', async () => {
    // Create and connect client
    const transport = new StdioClientTransport({
      command: 'tsx',
      args: [path.join(__dirname, 'test-server.ts')],
      cwd: tempDir
    });
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    
    // Get file URI
    const fileUri = `file://${path.join(tempDir, 'test.txt')}`;
    
    // Read resource
    const response = await client.request({
      method: 'resources/read',
      params: { uri: fileUri }
    });
    
    expect(response.contents).toHaveLength(1);
    expect(response.contents[0].text).toBe('Hello, world!');
    expect(response.contents[0].mimeType).toBe('text/plain');
  });
  
  test('client can list available tools', async () => {
    // Create and connect client
    const transport = new StdioClientTransport({
      command: 'tsx',
      args: [path.join(__dirname, 'test-server.ts')],
      cwd: tempDir
    });
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    
    // List tools
    const response = await client.request({
      method: 'tools/list',
      params: {}
    });
    
    expect(response.tools).toHaveLength(2);
    expect(response.tools.map((t: any) => t.name)).toContain('search_path');
    expect(response.tools.map((t: any) => t.name)).toContain('search_content');
  });
  
  test('client can use search_path tool', async () => {
    // Create and connect client
    const transport = new StdioClientTransport({
      command: 'tsx',
      args: [path.join(__dirname, 'test-server.ts')],
      cwd: tempDir
    });
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    
    // Call search_path tool
    const response = await client.request({
      method: 'tools/call',
      params: {
        name: 'search_path',
        arguments: { pattern: '*.txt' }
      }
    });
    
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toContain('test.txt');
  });
  
  test('client can use search_content tool', async () => {
    // Create and connect client
    const transport = new StdioClientTransport({
      command: 'tsx',
      args: [path.join(__dirname, 'test-server.ts')],
      cwd: tempDir
    });
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    
    // Call search_content tool
    const response = await client.request({
      method: 'tools/call',
      params: {
        name: 'search_content',
        arguments: { query: 'Hello' }
      }
    });
    
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toContain('test.txt');
    expect(response.content[0].text).toContain('Line 1');
  });
  
  test('server handles errors gracefully', async () => {
    // Create and connect client
    const transport = new StdioClientTransport({
      command: 'tsx',
      args: [path.join(__dirname, 'test-server.ts')],
      cwd: tempDir
    });
    
    client = new Client({
      name: 'test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    
    // Try to read non-existent file
    await expect(client.request({
      method: 'resources/read',
      params: { uri: 'file:///nonexistent.txt' }
    })).rejects.toThrow();
    
    // Try to use non-file URI
    await expect(client.request({
      method: 'resources/read',
      params: { uri: 'http://example.com' }
    })).rejects.toThrow('Only file:// URIs are supported');
    
    // Try unknown tool
    await expect(client.request({
      method: 'tools/call',
      params: {
        name: 'unknown_tool',
        arguments: {}
      }
    })).rejects.toThrow('Unknown tool');
  });
});