#!/usr/bin/env tsx
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';

/**
 * Interactive CLI for humans to test MCP server
 * Shows exact MCP protocol responses
 */
async function interactiveCLI() {
  console.log('='.repeat(80));
  console.log('🎮 PEEKABOO MCP - INTERACTIVE HUMAN CLI');
  console.log('='.repeat(80));
  console.log();

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'peekaboo> '
  });

  // Get root directory
  console.log('Enter root directory (or press Enter for current):');
  rl.prompt();
  
  let rootDir = process.cwd();
  let mcpProcess: any = null;

  rl.on('line', async (line) => {
    const input = line.trim();
    
    if (!mcpProcess && rootDir === process.cwd()) {
      // First input is the root directory
      rootDir = input || process.cwd();
      console.log(`\n✅ Using root: ${rootDir}\n`);
      
      // Start MCP server process
      mcpProcess = spawn('tsx', ['src/index.ts'], {
        env: { ...process.env, PEEKABOO_ROOT: rootDir },
        stdio: 'pipe'
      });
      
      mcpProcess.stderr.on('data', (data: Buffer) => {
        if (data.toString().includes('server started')) {
          showHelp();
          rl.prompt();
        }
      });
      
      return;
    }

    const [cmd, ...args] = input.split(' ');
    
    switch (cmd) {
      case 'help':
      case 'h':
        showHelp();
        break;
        
      case 'list':
      case 'ls':
        await runTest('list', rootDir);
        break;
        
      case 'read':
        if (args.length === 0) {
          console.log('Usage: read <file-path>');
        } else {
          await runTest('read', rootDir, args.join(' '));
        }
        break;
        
      case 'search':
        if (args.length === 0) {
          console.log('Usage: search <pattern>');
          console.log('Examples: *.ts, **/*.json, src/**/*.js');
        } else {
          await runTest('search', rootDir, args.join(' '));
        }
        break;
        
      case 'grep':
        if (args.length === 0) {
          console.log('Usage: grep <text> [file-pattern]');
        } else {
          await runTest('grep', rootDir, args[0], args[1]);
        }
        break;
        
      case 'quit':
      case 'q':
        if (mcpProcess) {
          mcpProcess.kill();
        }
        process.exit(0);
        
      default:
        if (input) {
          console.log('Unknown command. Type "help" for commands.');
        }
    }
    
    rl.prompt();
  });

  rl.on('close', () => {
    if (mcpProcess) {
      mcpProcess.kill();
    }
    process.exit(0);
  });
}

function showHelp() {
  console.log('\nCOMMANDS:');
  console.log('  list, ls              - List all files and directories');
  console.log('  read <path>           - Read a specific file');
  console.log('  search <pattern>      - Search files by name (e.g., *.ts)');
  console.log('  grep <text> [pattern] - Search for text in files');
  console.log('  help, h               - Show this help');
  console.log('  quit, q               - Exit\n');
}

async function runTest(command: string, rootDir: string, ...args: string[]) {
  console.log('\n' + '='.repeat(60));
  
  // Create a test script for the command
  let testScript = `
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'tsx',
  args: ['src/index.ts'],
  env: { 
    ...process.env,
    PEEKABOO_ROOT: '${rootDir}',
    PEEKABOO_RECURSIVE: 'true',
    PEEKABOO_MAX_DEPTH: '10'
  }
});

const client = new Client({
  name: 'cli-test',
  version: '1.0.0'
}, {
  capabilities: {}
});

await client.connect(transport);
`;

  switch (command) {
    case 'list':
      testScript += `
const resources = await client.listResources();
console.log('Found ' + resources.resources.length + ' items:\\n');
resources.resources.forEach(r => {
  const icon = r.mimeType === 'inode/directory' ? '📁' : '📄';
  const size = r.metadata?.size ? ' (' + r.metadata.size + ' bytes)' : '';
  console.log(icon + ' ' + r.name + ' [' + r.mimeType + ']' + size);
});
console.log('\\nRAW RESPONSE (first 3 items):');
console.log(JSON.stringify(resources.resources.slice(0, 3), null, 2));
`;
      break;
      
    case 'read':
      const filePath = args[0];
      const uri = filePath.startsWith('file://') 
        ? filePath 
        : `file://${path.join(rootDir, filePath.startsWith('/') ? filePath.slice(1) : filePath)}`;
      testScript += `
try {
  const content = await client.readResource({ uri: '${uri}' });
  console.log('FILE CONTENT:');
  console.log(content.contents[0].text);
  console.log('\\nMCP RESPONSE:');
  console.log(JSON.stringify(content, null, 2).substring(0, 300) + '...');
} catch (error) {
  console.log('Error: ' + error.message);
}
`;
      break;
      
    case 'search':
      testScript += `
const result = await client.callTool({
  name: 'search_path',
  arguments: { pattern: '${args[0]}' }
});
console.log(result.content[0].text);
`;
      break;
      
    case 'grep':
      testScript += `
const result = await client.callTool({
  name: 'search_content',
  arguments: { 
    query: '${args[0]}',
    ${args[1] ? `include: '${args[1]}',` : ''}
    ignoreCase: true
  }
});
console.log(result.content[0].text);
`;
      break;
  }

  testScript += `
await client.close();
`;

  // Run the test
  const proc = spawn('tsx', ['--eval', testScript], {
    stdio: 'inherit',
    env: process.env
  });
  
  await new Promise(resolve => proc.on('close', resolve));
  console.log('='.repeat(60) + '\n');
}

// Start the CLI
interactiveCLI().catch(console.error);