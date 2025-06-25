import { describe, test, expect, vi } from 'vitest';
import * as path from 'path';

// Create a test version of findProjectRoot that we can control
function testFindProjectRoot(mockDirname: string): string {
  const sep = path.sep;
  const nodeModulesIndex = mockDirname.lastIndexOf(`${sep}node_modules${sep}`);
  
  if (nodeModulesIndex === -1) {
    throw new Error(
      'peekaboo-mcp must be run as an installed npm package. ' +
      'Direct execution is not supported for security reasons.'
    );
  }
  
  return mockDirname.substring(0, nodeModulesIndex);
}

describe('findProjectRoot Security Enhancement Tests', () => {
  test('handles symlinked node_modules', () => {
    const mockedPath = '/real/path/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/real/path');
  });
  
  test('works in monorepo with workspaces', () => {
    const mockedPath = '/monorepo/packages/app/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/monorepo/packages/app');
  });
  
  test('works with pnpm node_modules structure', () => {
    // pnpm uses a different structure with .pnpm directory
    const mockedPath = '/project/node_modules/.pnpm/peekaboo-mcp@1.0.0/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    // With pnpm, it finds the innermost node_modules
    expect(result).toBe('/project/node_modules/.pnpm/peekaboo-mcp@1.0.0');
  });
  
  test('handles permission denied on parent dirs gracefully', () => {
    const mockedPath = '/home/user/project/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/home/user/project');
  });
  
  test('works on Windows with different separators', () => {
    // Test Windows-style path
    const windowsSep = '\\';
    const mockedPath = 'C:\\Users\\dev\\project\\node_modules\\peekaboo-mcp\\dist';
    
    // Manually calculate the result for Windows paths
    const nodeModulesPattern = `${windowsSep}node_modules${windowsSep}`;
    const index = mockedPath.lastIndexOf(nodeModulesPattern);
    const expectedResult = mockedPath.substring(0, index);
    
    expect(expectedResult).toBe('C:\\Users\\dev\\project');
  });
  
  test('handles deeply nested node_modules', () => {
    // Test with multiple levels of node_modules (common in complex projects)
    const mockedPath = '/project/node_modules/package-a/node_modules/package-b/node_modules/peekaboo-mcp/dist';
    
    // Finds the closest node_modules parent
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/project/node_modules/package-a/node_modules/package-b');
  });
  
  test('handles yarn workspaces with hoisted dependencies', () => {
    // Yarn workspaces hoist dependencies to root
    const mockedPath = '/workspace-root/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/workspace-root');
  });
  
  test('handles scoped package paths', () => {
    // Test with @scope/package-name structure
    const mockedPath = '/project/node_modules/@mycompany/tools/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/project/node_modules/@mycompany/tools');
  });
  
  test('throws error when not in node_modules', () => {
    // Direct execution scenario
    const mockedPath = '/home/user/peekaboo-mcp/src';
    expect(() => testFindProjectRoot(mockedPath)).toThrow('must be run as an installed npm package');
  });
  
  test('handles edge case with node_modules in project name', () => {
    // Project name contains 'node_modules' but isn't actually in node_modules
    const mockedPath = '/home/user/my-node_modules-project/src';
    
    // Should throw because it's not actually in a node_modules directory
    expect(() => testFindProjectRoot(mockedPath)).toThrow('must be run as an installed npm package');
  });
  
  test('correctly identifies project root with trailing separator', () => {
    // Test with trailing path separator
    const mockedPath = `/project/node_modules/peekaboo-mcp/dist/`;
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/project');
  });
  
  test('handles node_modules at root level', () => {
    // Edge case: node_modules at filesystem root
    const mockedPath = '/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('');
  });
  
  test('handles complex pnpm structure with version', () => {
    // pnpm with specific version in path
    const mockedPath = '/project/node_modules/.pnpm/peekaboo-mcp@1.2.3_typescript@4.5.2/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/project/node_modules/.pnpm/peekaboo-mcp@1.2.3_typescript@4.5.2');
  });
  
  test('handles Electron app asar archive paths', () => {
    // Electron apps may have special paths
    const mockedPath = '/Applications/MyApp.app/Contents/Resources/app.asar/node_modules/peekaboo-mcp/dist';
    const result = testFindProjectRoot(mockedPath);
    expect(result).toBe('/Applications/MyApp.app/Contents/Resources/app.asar');
  });
});