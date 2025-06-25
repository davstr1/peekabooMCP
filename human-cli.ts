#!/usr/bin/env tsx
import { createInterface } from 'readline';
import { createPeekabooServer } from './src/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Human-friendly CLI to test all MCP capabilities
 * Shows exactly what AI would see
 */
async function humanCLI() {
  console.log('='.repeat(80));
  console.log('🎮 PEEKABOO MCP - HUMAN TEST CLI');
  console.log('='.repeat(80));
  console.log();

  // Get root directory
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };

  console.log('Enter root directory to explore (press Enter for current directory):');
  const inputRoot = await askQuestion('> ');
  const rootDir = inputRoot.trim() || process.cwd();

  // Verify directory exists
  try {
    await fs.access(rootDir);
  } catch {
    console.log(`❌ Directory not found: ${rootDir}`);
    process.exit(1);
  }

  console.log(`\n✅ Using root: ${rootDir}\n`);

  // Create client
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
    name: 'human-cli',
    version: '1.0.0'
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('📡 Connected to MCP server!\n');

    // Main loop
    while (true) {
      console.log('\n' + '='.repeat(80));
      console.log('COMMANDS:');
      console.log('  1. list         - List all files and directories');
      console.log('  2. read <path>  - Read a specific file');
      console.log('  3. search <pattern> - Search files by name (e.g., *.ts, **/*.json)');
      console.log('  4. grep <text>  - Search for text in files');
      console.log('  5. grep <text> <pattern> - Search text in specific files');
      console.log('  6. tools        - Show available tools');
      console.log('  7. quit         - Exit');
      console.log('='.repeat(80));

      const input = await askQuestion('\nCommand: ');
      const [command, ...args] = input.trim().split(' ');

      console.log();

      try {
        switch (command.toLowerCase()) {
          case '1':
          case 'list':
          case 'ls': {
            console.log('📂 LISTING RESOURCES...');
            console.log('-'.repeat(80));
            const resources = await client.listResources();
            
            console.log(`Found ${resources.resources.length} items:\n`);
            
            // Group by type
            const dirs = resources.resources.filter(r => r.mimeType === 'inode/directory');
            const files = resources.resources.filter(r => r.mimeType !== 'inode/directory');
            
            if (dirs.length > 0) {
              console.log('DIRECTORIES:');
              dirs.forEach(d => {
                const depth = d.name.split('/').length - 2;
                const indent = '  '.repeat(depth);
                console.log(`${indent}📁 ${d.name}`);
              });
              console.log();
            }
            
            if (files.length > 0) {
              console.log('FILES:');
              files.forEach(f => {
                const depth = f.name.split('/').length - 2;
                const indent = '  '.repeat(depth);
                const size = f.metadata?.size ? ` (${f.metadata.size} bytes)` : '';
                console.log(`${indent}📄 ${f.name} [${f.mimeType}]${size}`);
              });
            }
            
            console.log('\nRAW MCP RESPONSE (first item):');
            console.log(JSON.stringify(resources.resources[0], null, 2));
            break;
          }

          case '2':
          case 'read': {
            const filePath = args.join(' ');
            if (!filePath) {
              console.log('❌ Usage: read <file-path>');
              break;
            }
            
            console.log(`📄 READING FILE: ${filePath}`);
            console.log('-'.repeat(80));
            
            const uri = filePath.startsWith('file://') 
              ? filePath 
              : `file://${path.join(rootDir, filePath.startsWith('/') ? filePath.slice(1) : filePath)}`;
            
            const content = await client.readResource({ uri });
            
            console.log('CONTENT:');
            console.log(content.contents[0].text);
            
            console.log('\nRAW MCP RESPONSE:');
            console.log(JSON.stringify(content, null, 2).substring(0, 500) + '...');
            break;
          }

          case '3':
          case 'search': {
            const pattern = args.join(' ');
            if (!pattern) {
              console.log('❌ Usage: search <pattern>');
              console.log('Examples: *.ts, **/*.json, src/**/*.js');
              break;
            }
            
            console.log(`🔍 SEARCHING FOR: ${pattern}`);
            console.log('-'.repeat(80));
            
            const result = await client.callTool({
              name: 'search_path',
              arguments: { pattern }
            });
            
            console.log(result.content[0].text);
            break;
          }

          case '4':
          case 'grep': {
            if (args.length === 0) {
              console.log('❌ Usage: grep <text> [file-pattern]');
              break;
            }
            
            const query = args[0];
            const include = args[1];
            
            console.log(`🔍 SEARCHING CONTENT FOR: "${query}"${include ? ` in ${include}` : ''}`);
            console.log('-'.repeat(80));
            
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

          case '5':
          case 'grep':
            // Handled above with args[1]
            break;

          case '6':
          case 'tools': {
            console.log('🛠️  AVAILABLE TOOLS:');
            console.log('-'.repeat(80));
            
            const tools = await client.listTools();
            tools.tools.forEach(tool => {
              console.log(`\n📌 ${tool.name}`);
              console.log(`   ${tool.description}`);
              console.log('\n   Parameters:');
              const props = tool.inputSchema.properties;
              Object.entries(props).forEach(([key, schema]: [string, any]) => {
                const required = tool.inputSchema.required?.includes(key) ? ' (required)' : ' (optional)';
                console.log(`   - ${key}${required}: ${schema.description}`);
              });
            });
            break;
          }

          case '7':
          case 'quit':
          case 'exit':
          case 'q':
            console.log('👋 Goodbye!');
            await client.close();
            rl.close();
            process.exit(0);

          default:
            console.log('❌ Unknown command. Type a number 1-7 or command name.');
        }
      } catch (error) {
        console.log('❌ Error:', error instanceof Error ? error.message : error);
      }
    }

  } catch (error) {
    console.error('❌ Failed to connect:', error);
  } finally {
    rl.close();
    process.exit(1);
  }
}

// Run the CLI
humanCLI().catch(console.error);