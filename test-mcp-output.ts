#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Test client that shows EXACTLY what the AI sees from the MCP server
 * This displays the raw MCP protocol responses in a human-readable format
 */
async function showMCPOutput() {
  console.log('='.repeat(80));
  console.log('PEEKABOO MCP OUTPUT VIEWER - What the AI Actually Sees');
  console.log('='.repeat(80));
  console.log();

  // Use the test-files directory as root to avoid issues
  const testRoot = process.cwd() + '/test-files';
  
  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['src/index.ts'],
    env: { 
      ...process.env,
      PEEKABOO_ROOT: testRoot,
      PEEKABOO_RECURSIVE: 'true',
      PEEKABOO_MAX_DEPTH: '3'
    }
  });

  const client = new Client({
    name: 'mcp-output-viewer',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    // Connect to server
    console.log('📡 Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // Note: Server info is exchanged during connection, not via a separate method
    console.log('🖥️  SERVER INFO is exchanged during initial connection');
    console.log();

    // List all resources
    console.log('📂 LISTING RESOURCES (what AI sees as available files):');
    console.log('-'.repeat(80));
    const resources = await client.listResources();
    
    console.log(`Total resources found: ${resources.resources.length}`);
    console.log('\nRAW MCP RESPONSE:');
    console.log(JSON.stringify(resources, null, 2));
    console.log();

    // Show categorized view
    console.log('📊 CATEGORIZED VIEW:');
    const dirs = resources.resources.filter(r => r.mimeType === 'inode/directory');
    const files = resources.resources.filter(r => r.mimeType !== 'inode/directory');
    
    console.log(`\nDirectories (${dirs.length}):`);
    dirs.slice(0, 10).forEach(d => {
      console.log(`  📁 ${d.name} [${d.uri}]`);
    });
    if (dirs.length > 10) console.log(`  ... and ${dirs.length - 10} more`);

    console.log(`\nFiles (${files.length}):`);
    const filesByType = files.reduce((acc, f) => {
      const type = f.mimeType || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(f);
      return acc;
    }, {} as Record<string, typeof files>);

    Object.entries(filesByType).forEach(([type, items]) => {
      console.log(`\n  ${type} (${items.length} files):`);
      items.slice(0, 3).forEach(f => {
        console.log(`    📄 ${f.name}`);
        console.log(`       URI: ${f.uri}`);
      });
      if (items.length > 3) console.log(`    ... and ${items.length - 3} more`);
    });

    // Read a specific file
    console.log('\n' + '='.repeat(80));
    console.log('📖 READING A FILE (what AI receives when reading):');
    console.log('-'.repeat(80));
    
    const packageJson = resources.resources.find(r => r.name === 'package.json');
    if (packageJson) {
      console.log(`\nReading: ${packageJson.name}`);
      console.log(`URI: ${packageJson.uri}`);
      
      const content = await client.readResource({ uri: packageJson.uri });
      console.log('\nRAW MCP READ RESPONSE:');
      console.log(JSON.stringify(content, null, 2));
      
      console.log('\n📝 EXTRACTED CONTENT:');
      console.log('-'.repeat(40));
      if (content.contents && content.contents[0]) {
        const text = content.contents[0].text;
        console.log(text.substring(0, 500));
        if (text.length > 500) console.log('\n... (truncated for display)');
      }
    }

    // Test error handling
    console.log('\n' + '='.repeat(80));
    console.log('🚫 ERROR HANDLING (what AI sees on errors):');
    console.log('-'.repeat(80));
    
    try {
      await client.readResource({ uri: 'file:///etc/passwd' });
    } catch (error) {
      console.log('\nAttempted to read: file:///etc/passwd');
      console.log('Error response:');
      console.log(JSON.stringify(error, null, 2));
      console.log(`\nError message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Show protocol capabilities
    console.log('\n' + '='.repeat(80));
    console.log('🔧 PROTOCOL CAPABILITIES:');
    console.log('-'.repeat(80));
    console.log('Client capabilities:', client.clientCapabilities);
    console.log('Server capabilities:', client.serverCapabilities);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    console.log('\n' + '='.repeat(80));
    console.log('Closing connection...');
    await client.close();
    process.exit(0);
  }
}

// Run the viewer
showMCPOutput().catch(console.error);