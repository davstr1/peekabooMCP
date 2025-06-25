#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Simple MCP output viewer that shows exactly what AI sees
 * Creates a safe test directory to avoid path traversal issues
 */
async function showMCPOutput() {
  console.log('='.repeat(80));
  console.log('🔍 PEEKABOO MCP - WHAT THE AI SEES');
  console.log('='.repeat(80));
  console.log();

  // Create a simple test directory structure
  const testDir = path.join(process.cwd(), 'mcp-test-output');
  console.log(`📁 Creating test directory: ${testDir}`);
  
  try {
    await fs.mkdir(testDir, { recursive: true });
    await fs.writeFile(path.join(testDir, 'hello.txt'), 'Hello from MCP!');
    await fs.writeFile(path.join(testDir, 'data.json'), JSON.stringify({ test: true }, null, 2));
    await fs.mkdir(path.join(testDir, 'subfolder'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'subfolder', 'nested.md'), '# Nested File\nThis is nested content.');
  } catch (e) {
    // Directory might already exist
  }

  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['src/index.ts'],
    env: { 
      ...process.env,
      PEEKABOO_ROOT: testDir,
      PEEKABOO_RECURSIVE: 'true',
      PEEKABOO_MAX_DEPTH: '2'
    }
  });

  const client = new Client({
    name: 'mcp-viewer',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    console.log('\n📡 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // 1. LIST RESOURCES
    console.log('1️⃣ RESOURCE LISTING (listResources response):');
    console.log('-'.repeat(80));
    
    const resources = await client.listResources();
    console.log('RAW RESPONSE:');
    console.log(JSON.stringify(resources, null, 2));
    
    console.log('\n📊 PARSED VIEW:');
    console.log(`Total items: ${resources.resources.length}`);
    resources.resources.forEach(r => {
      const icon = r.mimeType === 'inode/directory' ? '📁' : '📄';
      console.log(`  ${icon} ${r.name} (${r.mimeType}) -> ${r.uri}`);
    });

    // 2. READ A FILE
    console.log('\n\n2️⃣ FILE READING (readResource response):');
    console.log('-'.repeat(80));
    
    const jsonFile = resources.resources.find(r => r.name.endsWith('.json'));
    if (jsonFile) {
      console.log(`Reading: ${jsonFile.name}`);
      console.log(`URI: ${jsonFile.uri}\n`);
      
      const content = await client.readResource({ uri: jsonFile.uri });
      console.log('RAW RESPONSE:');
      console.log(JSON.stringify(content, null, 2));
      
      console.log('\nCONTENT:');
      if (content.contents?.[0]?.text) {
        console.log(content.contents[0].text);
      }
    }

    // 3. ERROR CASE
    console.log('\n\n3️⃣ ERROR HANDLING (invalid path):');
    console.log('-'.repeat(80));
    
    try {
      console.log('Attempting to read: file:///etc/passwd');
      await client.readResource({ uri: 'file:///etc/passwd' });
    } catch (error) {
      console.log('ERROR RESPONSE:');
      console.log(error);
      console.log(`\nError type: ${error.constructor.name}`);
      console.log(`Message: ${error.message}`);
    }

    // 4. CAPABILITIES
    console.log('\n\n4️⃣ MCP CAPABILITIES:');
    console.log('-'.repeat(80));
    console.log('Server advertises these capabilities:');
    console.log(JSON.stringify(client.serverCapabilities, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('Closing connection...');
    await client.close();
    
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true });
      console.log('✅ Cleaned up test directory');
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(0);
  }
}

showMCPOutput().catch(console.error);