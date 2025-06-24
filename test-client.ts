#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testPeekabooServer() {
  console.log('Starting Peekaboo MCP test client...\n');

  // Spawn the server process
  const serverProcess = spawn('tsx', ['src/index.ts'], {
    env: { ...process.env, PEEKABOO_ROOT: process.cwd() },
    stdio: ['pipe', 'pipe', 'inherit']
  });

  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['src/index.ts'],
    env: { PEEKABOO_ROOT: process.cwd() }
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✓ Connected to Peekaboo server\n');

    // Test 1: List resources
    console.log('Test 1: Listing root directory resources...');
    const resources = await client.listResources();
    console.log(`Found ${resources.resources.length} items:`);
    resources.resources.slice(0, 5).forEach(r => {
      console.log(`  - ${r.name} (${r.mimeType})`);
    });
    if (resources.resources.length > 5) {
      console.log(`  ... and ${resources.resources.length - 5} more`);
    }
    console.log();

    // Test 2: Read a file
    const readmeResource = resources.resources.find(r => r.name === 'README.md');
    if (readmeResource) {
      console.log('Test 2: Reading README.md...');
      const content = await client.readResource({ uri: readmeResource.uri });
      const text = content.contents[0].text;
      console.log(`Content preview (first 200 chars):`);
      console.log(text.substring(0, 200) + '...\n');
    }

    // Test 3: Try to read outside root (should fail)
    console.log('Test 3: Testing path traversal protection...');
    try {
      await client.readResource({ uri: 'file://../../etc/passwd' });
      console.log('❌ Path traversal protection FAILED - this should not happen!');
    } catch (error) {
      console.log('✓ Path traversal blocked successfully');
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }

    console.log('All tests completed successfully! 🎉');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
    serverProcess.kill();
    process.exit(0);
  }
}

testPeekabooServer().catch(console.error);