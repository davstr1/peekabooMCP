#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Test the new search tools
 */
async function testSearchTools() {
  console.log('='.repeat(80));
  console.log('🔍 TESTING SEARCH TOOLS');
  console.log('='.repeat(80));
  console.log();

  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['src/index.ts'],
    env: { 
      ...process.env,
      PEEKABOO_ROOT: process.cwd(),
      PEEKABOO_RECURSIVE: 'true',
      PEEKABOO_MAX_DEPTH: '10'
    }
  });

  const client = new Client({
    name: 'search-test',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // List available tools
    console.log('🛠️  AVAILABLE TOOLS:');
    console.log('-'.repeat(80));
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`\n📌 ${tool.name}: ${tool.description}`);
      console.log('Input schema:', JSON.stringify(tool.inputSchema, null, 2));
    });

    // Test search_path
    console.log('\n\n1️⃣ TESTING search_path tool:');
    console.log('-'.repeat(80));
    
    console.log('\nSearching for "*.ts" files:');
    const tsFiles = await client.callTool({
      name: 'search_path',
      arguments: { pattern: '*.ts' }
    });
    console.log(tsFiles.content[0].text);

    console.log('\nSearching for "**/*.json" files:');
    const jsonFiles = await client.callTool({
      name: 'search_path',
      arguments: { pattern: '**/*.json' }
    });
    console.log(jsonFiles.content[0].text);

    // Test search_content
    console.log('\n\n2️⃣ TESTING search_content tool:');
    console.log('-'.repeat(80));
    
    console.log('\nSearching for "TODO" in all files:');
    const todos = await client.callTool({
      name: 'search_content',
      arguments: { query: 'TODO' }
    });
    console.log(todos.content[0].text);

    console.log('\nSearching for "function" in .ts files only:');
    const functions = await client.callTool({
      name: 'search_content',
      arguments: { 
        query: 'function',
        include: '*.ts'
      }
    });
    console.log(functions.content[0].text.substring(0, 500) + '...');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

testSearchTools().catch(console.error);