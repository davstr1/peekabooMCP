#!/usr/bin/env node
/**
 * Example MCP client for testing peekaboo-mcp server
 * 
 * This demonstrates how to connect to the server and use its capabilities.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
  console.log('🔍 Peekaboo MCP Test Client\n');
  
  // Create transport connected to the server
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['peekaboo-mcp'],
    env: {
      ...process.env,
      PEEKABOO_RECURSIVE: 'true',
      PEEKABOO_MAX_DEPTH: '5'
    }
  });
  
  // Create client
  const client = new Client({
    name: 'peekaboo-test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  try {
    // Connect to server
    console.log('Connecting to peekaboo-mcp server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');
    
    // List available tools
    console.log('📋 Available Tools:');
    const tools = await client.request({
      method: 'tools/list',
      params: {}
    });
    
    for (const tool of tools.tools) {
      console.log(`  - ${tool.name}: ${tool.description}`);
    }
    console.log('');
    
    // List resources (files)
    console.log('📁 Listing Resources:');
    const resources = await client.request({
      method: 'resources/list',
      params: {}
    });
    
    console.log(`Found ${resources.resources.length} resources`);
    
    // Show first 5 files
    const filesToShow = resources.resources.slice(0, 5);
    for (const resource of filesToShow) {
      console.log(`  - ${resource.name} (${resource.mimeType})`);
    }
    
    if (resources.resources.length > 5) {
      console.log(`  ... and ${resources.resources.length - 5} more`);
    }
    console.log('');
    
    // Read a specific file (if found)
    const readmeResource = resources.resources.find(r => 
      r.name.toLowerCase().includes('readme')
    );
    
    if (readmeResource) {
      console.log(`📖 Reading ${readmeResource.name}:`);
      const content = await client.request({
        method: 'resources/read',
        params: { uri: readmeResource.uri }
      });
      
      const text = content.contents[0].text;
      console.log(text.substring(0, 200) + '...\n');
    }
    
    // Search for files
    console.log('🔎 Searching for TypeScript files:');
    const searchResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'search_path',
        arguments: { pattern: '*.ts' }
      }
    });
    
    console.log(searchResult.content[0].text);
    console.log('');
    
    // Search content
    console.log('🔍 Searching for "TODO" in files:');
    const contentSearchResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'search_content',
        arguments: { 
          query: 'TODO',
          include: '*.ts'
        }
      }
    });
    
    console.log(contentSearchResult.content[0].text);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Disconnect
    console.log('\nDisconnecting...');
    await client.close();
    console.log('👋 Goodbye!');
  }
}

// Run the client
main().catch(console.error);