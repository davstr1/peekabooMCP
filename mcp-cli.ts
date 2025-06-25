#!/usr/bin/env tsx
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createInterface } from 'readline';
import path from 'path';

/**
 * Simple CLI to test MCP server - shows exact output AI would see
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help') {
    console.log(`
🎮 PEEKABOO MCP CLI - Test what AI sees

Usage:
  npm run cli list [directory]              - List all files
  npm run cli read <file>                   - Read file contents  
  npm run cli search <pattern> [directory]  - Search by filename
  npm run cli grep <text> [pattern] [dir]   - Search in files

Examples:
  npm run cli list
  npm run cli list ./test-files
  npm run cli read test-files/sample.txt
  npm run cli search "*.json"
  npm run cli grep "TODO"
  npm run cli grep "function" "*.ts"
`);
    return;
  }

  const command = args[0];
  const rootDir = findRootDir(args);
  
  console.log(`📁 Root: ${rootDir}\n`);

  const transport = new StdioClientTransport({
    command: 'tsx',
    args: ['src/index.ts'],
    env: { 
      ...process.env,
      PEEKABOO_ROOT: rootDir,
      PEEKABOO_RECURSIVE: 'true',
      PEEKABOO_MAX_DEPTH: '10'
    }
  });

  const client = new Client({
    name: 'mcp-cli',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);

    switch (command) {
      case 'list':
      case 'ls': {
        console.log('📂 MCP RESPONSE FROM listResources():');
        console.log('='.repeat(60));
        
        const resources = await client.listResources();
        
        // Show summary
        const dirs = resources.resources.filter(r => r.mimeType === 'inode/directory');
        const files = resources.resources.filter(r => r.mimeType !== 'inode/directory');
        
        console.log(`Found: ${dirs.length} directories, ${files.length} files\n`);
        
        // Show tree view
        resources.resources.forEach(r => {
          const depth = r.name.split('/').length - 2;
          const indent = '  '.repeat(depth);
          const icon = r.mimeType === 'inode/directory' ? '📁' : '📄';
          const size = r.metadata?.size ? ` (${r.metadata.size} bytes)` : '';
          console.log(`${indent}${icon} ${r.name} [${r.mimeType}]${size}`);
        });
        
        console.log('\nRAW MCP DATA (first item):');
        console.log(JSON.stringify(resources.resources[0], null, 2));
        break;
      }

      case 'read': {
        const filePath = args[1];
        if (!filePath) {
          console.log('❌ Usage: npm run cli read <file-path>');
          break;
        }
        
        console.log(`📄 MCP RESPONSE FROM readResource("${filePath}"):`);
        console.log('='.repeat(60));
        
        const uri = filePath.startsWith('file://') 
          ? filePath 
          : `file://${path.resolve(rootDir, filePath)}`;
        
        try {
          const content = await client.readResource({ uri });
          
          console.log('FILE CONTENTS:');
          console.log(content.contents[0].text);
          
          console.log('\nMCP METADATA:');
          console.log(`URI: ${content.contents[0].uri}`);
          console.log(`MIME: ${content.contents[0].mimeType}`);
        } catch (error) {
          console.log(`❌ Error: ${error.message}`);
        }
        break;
      }

      case 'search': {
        const pattern = args[1];
        if (!pattern) {
          console.log('❌ Usage: npm run cli search <pattern>');
          console.log('Examples: *.ts, **/*.json, src/**/*.js');
          break;
        }
        
        console.log(`🔍 MCP RESPONSE FROM search_path tool("${pattern}"):`);
        console.log('='.repeat(60));
        
        const result = await client.callTool({
          name: 'search_path',
          arguments: { pattern }
        });
        
        console.log(result.content[0].text);
        break;
      }

      case 'grep': {
        const query = args[1];
        if (!query) {
          console.log('❌ Usage: npm run cli grep <text> [file-pattern]');
          break;
        }
        
        const include = args[2];
        
        console.log(`🔍 MCP RESPONSE FROM search_content tool("${query}"${include ? `, "${include}"` : ''}):`);
        console.log('='.repeat(60));
        
        const result = await client.callTool({
          name: 'search_content',
          arguments: { 
            query,
            include,
            ignoreCase: true
          }
        });
        
        console.log(result.content[0].text);
        break;
      }

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log('Run: npm run cli help');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

function findRootDir(args: string[]): string {
  // Look for directory in args
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('-') && !arg.includes('*') && !arg.includes('"')) {
      try {
        const stats = require('fs').statSync(arg);
        if (stats.isDirectory()) {
          return path.resolve(arg);
        }
      } catch {}
    }
  }
  return process.cwd();
}

main().catch(console.error);