#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Shows ACTUAL MCP output, including errors and bugs
 * This is what AI clients actually see when using this MCP server
 */
async function showActualMCPOutput() {
  console.log('='.repeat(80));
  console.log('🔍 PEEKABOO MCP - ACTUAL OUTPUT (including bugs)');
  console.log('='.repeat(80));
  console.log();

  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['src/index.ts'],
    env: { 
      ...process.env,
      PEEKABOO_ROOT: process.cwd() + '/test-files',
      PEEKABOO_RECURSIVE: 'true',
      PEEKABOO_MAX_DEPTH: '3'
    }
  });

  const client = new Client({
    name: 'actual-output-viewer',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    console.log('📡 Connecting to MCP server...');
    console.log(`Using root: ${process.cwd()}/test-files`);
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // Try to list resources - this will likely fail due to the bug
    console.log('📂 Attempting to list resources...');
    console.log('-'.repeat(80));
    
    try {
      const resources = await client.listResources();
      console.log('SUCCESS - Resources received:');
      console.log(JSON.stringify(resources, null, 2));
    } catch (error) {
      console.log('❌ FAILED - This is what AI sees:');
      console.log(`Error type: ${error.constructor.name}`);
      console.log(`Error code: ${error.code}`);
      console.log(`Error message: ${error.message}`);
      console.log('\nFull error object:');
      console.log(error);
    }

    // Try to read a specific file directly
    console.log('\n\n📄 Attempting to read a file directly...');
    console.log('-'.repeat(80));
    
    try {
      // Try with full path
      const testFilePath = `file://${process.cwd()}/test-files/sample.txt`;
      console.log(`Trying to read: ${testFilePath}`);
      const content = await client.readResource({ uri: testFilePath });
      console.log('SUCCESS - Content received:');
      console.log(JSON.stringify(content, null, 2));
    } catch (error) {
      console.log('❌ FAILED - This is what AI sees:');
      console.log(`Error: ${error.message}`);
    }

    // Show server capabilities
    console.log('\n\n🔧 Server capabilities (what AI knows the server can do):');
    console.log('-'.repeat(80));
    console.log(JSON.stringify(client.serverCapabilities, null, 2));

  } catch (error) {
    console.error('\n❌ Connection error:', error);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('SUMMARY: The MCP server has a path resolution bug that prevents it from working.');
    console.log('AI clients will receive "Path traversal detected" errors when trying to use it.');
    console.log('='.repeat(80));
    
    await client.close();
    process.exit(0);
  }
}

showActualMCPOutput().catch(console.error);