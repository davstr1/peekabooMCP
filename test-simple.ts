#!/usr/bin/env tsx
import { createPeekabooServer } from './src/index.js';
import { listDirectory, normalizeAndValidatePath } from './src/fs-utils.js';
import path from 'path';

/**
 * Direct test of the server functions to diagnose the issue
 */
async function testDirectly() {
  console.log('🔍 DIRECT TEST OF PEEKABOO FUNCTIONS\n');
  
  const testRoot = path.join(process.cwd(), 'test-files');
  console.log(`Test root: ${testRoot}`);
  console.log(`Resolved test root: ${path.resolve(testRoot)}\n`);
  
  try {
    // Test 1: Path validation
    console.log('1️⃣ Testing path validation:');
    const validPath = normalizeAndValidatePath(testRoot, '/');
    console.log(`✅ Valid path "/" resolved to: ${validPath}`);
    
    try {
      const invalidPath = normalizeAndValidatePath(testRoot, '../');
      console.log(`❌ Invalid path "../" resolved to: ${invalidPath}`);
    } catch (e) {
      console.log(`✅ Path "../" correctly rejected: ${e.message}`);
    }
    
    // Test 2: List directory
    console.log('\n2️⃣ Testing directory listing:');
    const items = await listDirectory(testRoot, '/', true, 3);
    console.log(`Found ${items.length} items in root`);
    
    // Show the structure
    const showItems = (items: any[], indent = '') => {
      for (const item of items) {
        console.log(`${indent}${item.type === 'directory' ? '📁' : '📄'} ${item.name} (${item.path})`);
        if (item.children) {
          showItems(item.children, indent + '  ');
        }
      }
    };
    showItems(items);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDirectly().catch(console.error);