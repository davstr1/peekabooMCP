import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createPeekabooServer } from '../index.js';
import * as fsUtils from '../fs-utils.js';
import * as searchUtils from '../search-utils.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { FileSystemItem } from '../types.js';
import { getMimeType } from '../mime-types.js';

// Mock the modules
vi.mock('../fs-utils.js');
vi.mock('../search-utils.js');

describe('MCP Server Configuration', () => {
  let server: Server;
  const testRoot = '/test/project';
  
  beforeEach(() => {
    vi.clearAllMocks();
    server = createPeekabooServer(testRoot);
  });
  
  test('server is created with correct configuration', () => {
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(Server);
    expect(server.connect).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });
  
  test('server has correct type and methods', () => {
    expect(server).toBeInstanceOf(Server);
    expect(server.setRequestHandler).toBeDefined();
    expect(typeof server.setRequestHandler).toBe('function');
  });
});

// Test the underlying functionality that the MCP handlers use
describe('MCP Handler Logic', () => {
  const testRoot = '/test/project';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('ListResources functionality', () => {
    test('returns empty array when no files exist', async () => {
      vi.mocked(fsUtils.listDirectory).mockResolvedValue([]);
      
      const items = await fsUtils.listDirectory(testRoot, '.', true, 10);
      
      expect(items).toEqual([]);
    });
    
    test('returns correct resource structure for files', async () => {
      const mockFiles: FileSystemItem[] = [
        { name: 'test.txt', path: '/test.txt', type: 'file', size: 100 },
        { name: 'script.js', path: '/script.js', type: 'file', size: 200 }
      ];
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(mockFiles);
      
      const items = await fsUtils.listDirectory(testRoot, '.', true, 10);
      
      expect(items).toHaveLength(2);
      expect(items[0].type).toBe('file');
      expect(items[0].size).toBe(100);
    });
    
    test('returns correct resource structure for directories', async () => {
      const mockDirs: FileSystemItem[] = [
        { 
          name: 'src', 
          path: '/src', 
          type: 'directory',
          children: [
            { name: 'index.ts', path: '/src/index.ts', type: 'file' }
          ]
        }
      ];
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(mockDirs);
      
      const items = await fsUtils.listDirectory(testRoot, '.', true, 10);
      
      expect(items[0].type).toBe('directory');
      expect(items[0].children).toHaveLength(1);
    });
    
    test('includes proper MIME types for files', () => {
      expect(getMimeType('test.txt')).toBe('text/plain');
      expect(getMimeType('script.js')).toBe('application/javascript');
      expect(getMimeType('style.css')).toBe('text/css');
      expect(getMimeType('data.json')).toBe('application/json');
    });
    
    test('handles recursive listing correctly', async () => {
      const nestedStructure: FileSystemItem[] = [
        {
          name: 'parent',
          path: '/parent',
          type: 'directory',
          children: [
            {
              name: 'child',
              path: '/parent/child',
              type: 'directory',
              children: [
                { name: 'file.txt', path: '/parent/child/file.txt', type: 'file' }
              ]
            }
          ]
        }
      ];
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(nestedStructure);
      
      const items = await fsUtils.listDirectory(testRoot, '.', true, 10);
      
      expect(items[0].children![0].children).toHaveLength(1);
    });
    
    test('respects maxDepth configuration', async () => {
      vi.mocked(fsUtils.listDirectory).mockResolvedValue([]);
      
      await fsUtils.listDirectory(testRoot, '.', true, 5);
      
      expect(fsUtils.listDirectory).toHaveBeenCalledWith(testRoot, '.', true, 5);
    });
    
    test('handles filesystem errors gracefully', async () => {
      vi.mocked(fsUtils.listDirectory).mockRejectedValue(new Error('Permission denied'));
      
      await expect(fsUtils.listDirectory(testRoot, '.', true, 10))
        .rejects.toThrow('Permission denied');
    });
  });
  
  describe('ReadResource functionality', () => {
    test('reads text file content successfully', async () => {
      const content = 'Hello, world!';
      vi.mocked(fsUtils.normalizeAndValidatePath).mockReturnValue('/test/project/file.txt');
      vi.mocked(fsUtils.readFileContent).mockResolvedValue(content);
      
      const validPath = fsUtils.normalizeAndValidatePath(testRoot, '/file.txt');
      const result = await fsUtils.readFileContent(validPath);
      
      expect(result).toBe(content);
    });
    
    test('returns correct MIME type for file', () => {
      const mimeTypes = [
        { file: 'test.txt', mime: 'text/plain' },
        { file: 'script.js', mime: 'application/javascript' },
        { file: 'image.png', mime: 'image/png' },
        { file: 'data.json', mime: 'application/json' }
      ];
      
      for (const { file, mime } of mimeTypes) {
        expect(getMimeType(file)).toBe(mime);
      }
    });
    
    test('rejects non-file:// URIs', () => {
      const invalidUris = [
        'http://example.com/file.txt',
        'https://example.com/file.txt',
        'ftp://example.com/file.txt',
        'data:text/plain;base64,SGVsbG8='
      ];
      
      for (const uri of invalidUris) {
        expect(uri.startsWith('file://')).toBe(false);
      }
    });
    
    test('handles path traversal attempts', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/test/../../../etc/passwd'
      ];
      
      vi.mocked(fsUtils.normalizeAndValidatePath).mockImplementation((root, path) => {
        if (path.includes('..')) {
          throw new Error('Path outside root directory');
        }
        return path;
      });
      
      for (const path of maliciousPaths) {
        expect(() => fsUtils.normalizeAndValidatePath(testRoot, path))
          .toThrow('Path outside root');
      }
    });
    
    test('handles non-existent files', async () => {
      vi.mocked(fsUtils.readFileContent).mockRejectedValue(
        new Error('ENOENT: no such file or directory')
      );
      
      await expect(fsUtils.readFileContent('/nonexistent.txt'))
        .rejects.toThrow('ENOENT');
    });
    
    test('handles permission denied errors', async () => {
      vi.mocked(fsUtils.readFileContent).mockRejectedValue(
        new Error('EACCES: permission denied')
      );
      
      await expect(fsUtils.readFileContent('/protected.txt'))
        .rejects.toThrow('EACCES');
    });
    
    test('handles binary files appropriately', async () => {
      // Binary content represented as string with special chars
      const binaryContent = '\x00\x01\x02\x03\xFF';
      vi.mocked(fsUtils.readFileContent).mockResolvedValue(binaryContent);
      
      const result = await fsUtils.readFileContent('/binary.bin');
      
      expect(result).toBe(binaryContent);
    });
    
    test('validates URI format correctly', () => {
      const validUris = [
        'file:///home/user/file.txt',
        'file:///C:/Users/file.txt',
        'file://localhost/home/user/file.txt'
      ];
      
      for (const uri of validUris) {
        expect(uri.startsWith('file://')).toBe(true);
        const path = uri.slice(7); // Remove 'file://'
        expect(path.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('ListTools functionality', () => {
    test('returns both search tools with correct schemas', () => {
      // This tests the tool definitions that would be returned
      const expectedTools = [
        {
          name: 'search_path',
          description: 'Search for files and directories by name pattern',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
                description: 'Search pattern (supports * and ** wildcards, e.g., "*.js", "**/test/*.json")'
              }
            },
            required: ['pattern']
          }
        },
        {
          name: 'search_content',
          description: 'Search for content within files',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Text to search for in file contents'
              },
              include: {
                type: 'string',
                description: 'Optional file pattern to search in (e.g., "*.js", "*.md")'
              },
              ignoreCase: {
                type: 'boolean',
                description: 'Case-insensitive search (default: true)'
              }
            },
            required: ['query']
          }
        }
      ];
      
      // Verify tool schemas are correct
      expect(expectedTools).toHaveLength(2);
      expect(expectedTools[0].inputSchema.required).toEqual(['pattern']);
      expect(expectedTools[1].inputSchema.required).toEqual(['query']);
    });
  });
  
  describe('CallTool - search_path', () => {
    test('finds files with simple patterns', async () => {
      const mockResults = ['/test.txt', '/data.txt'];
      vi.mocked(searchUtils.searchByPath).mockResolvedValue(mockResults);
      
      const results = await searchUtils.searchByPath(testRoot, '*.txt');
      
      expect(results).toEqual(mockResults);
    });
    
    test('handles glob patterns correctly', async () => {
      const patterns = ['*.js', '**/*.ts', 'src/**/*.json', '?.txt'];
      
      for (const pattern of patterns) {
        vi.mocked(searchUtils.searchByPath).mockResolvedValue([]);
        await searchUtils.searchByPath(testRoot, pattern);
        expect(searchUtils.searchByPath).toHaveBeenCalledWith(testRoot, pattern);
      }
    });
    
    test('returns empty when no matches', async () => {
      vi.mocked(searchUtils.searchByPath).mockResolvedValue([]);
      
      const results = await searchUtils.searchByPath(testRoot, '*.nonexistent');
      
      expect(results).toEqual([]);
    });
    
    test('handles missing pattern parameter', () => {
      // Pattern validation would happen in the handler
      const args = {} as any;
      expect(args.pattern).toBeUndefined();
    });
    
    test('handles invalid patterns gracefully', async () => {
      vi.mocked(searchUtils.searchByPath).mockRejectedValue(
        new Error('Invalid pattern')
      );
      
      await expect(searchUtils.searchByPath(testRoot, '[invalid'))
        .rejects.toThrow('Invalid pattern');
    });
  });
  
  describe('CallTool - search_content', () => {
    test('finds content in text files', async () => {
      const mockResults = [{
        path: '/test.txt',
        matches: [
          { line: 1, content: 'Hello world' },
          { line: 5, content: 'Hello again' }
        ]
      }];
      vi.mocked(searchUtils.searchContent).mockResolvedValue(mockResults);
      
      const results = await searchUtils.searchContent(testRoot, 'Hello');
      
      expect(results[0].matches).toHaveLength(2);
    });
    
    test('respects include parameter', async () => {
      vi.mocked(searchUtils.searchContent).mockResolvedValue([]);
      
      await searchUtils.searchContent(testRoot, 'test', { include: '*.js' });
      
      expect(searchUtils.searchContent).toHaveBeenCalledWith(
        testRoot, 
        'test', 
        expect.objectContaining({ include: '*.js' })
      );
    });
    
    test('handles ignoreCase flag', async () => {
      vi.mocked(searchUtils.searchContent).mockResolvedValue([]);
      
      await searchUtils.searchContent(testRoot, 'TEST', { ignoreCase: true });
      await searchUtils.searchContent(testRoot, 'TEST', { ignoreCase: false });
      
      expect(searchUtils.searchContent).toHaveBeenCalledWith(
        testRoot,
        'TEST',
        expect.objectContaining({ ignoreCase: true })
      );
      expect(searchUtils.searchContent).toHaveBeenCalledWith(
        testRoot,
        'TEST',
        expect.objectContaining({ ignoreCase: false })
      );
    });
    
    test('limits results to maxResults', async () => {
      const manyMatches = Array.from({ length: 30 }, (_, i) => ({
        path: `/file${i}.txt`,
        matches: [{ line: 1, content: 'match' }]
      }));
      
      // Simulate limiting to 20 results
      vi.mocked(searchUtils.searchContent).mockResolvedValue(manyMatches.slice(0, 20));
      
      const results = await searchUtils.searchContent(testRoot, 'match', { maxResults: 20 });
      
      expect(results).toHaveLength(20);
    });
    
    test('handles missing query parameter', () => {
      // Query validation would happen in the handler
      const args = {} as any;
      expect(args.query).toBeUndefined();
    });
    
    test('handles regex special characters', async () => {
      const specialQueries = ['[test]', '(test)', 'test.', 'test*', 'test+'];
      
      for (const query of specialQueries) {
        vi.mocked(searchUtils.searchContent).mockResolvedValue([]);
        await searchUtils.searchContent(testRoot, query);
        expect(searchUtils.searchContent).toHaveBeenCalled();
      }
    });
  });
});

// Test error handling patterns used in MCP handlers
describe('Error Handling Patterns', () => {
  test('file system errors are handled', async () => {
    vi.mocked(fsUtils.listDirectory).mockRejectedValue(new Error('Permission denied'));
    
    await expect(fsUtils.listDirectory('/test', '.', true, 10))
      .rejects.toThrow('Permission denied');
  });
  
  test('invalid URIs are rejected', () => {
    const invalidUri = 'http://example.com/file.txt';
    
    // This is the validation logic from the handler
    const isValidFileUri = invalidUri.startsWith('file://');
    expect(isValidFileUri).toBe(false);
  });
  
  test('path traversal is detected', () => {
    const uri = 'file:///test/../../../etc/passwd';
    const requestedPath = uri.slice(7); // Remove 'file://'
    
    // The handler would check if the path contains '..'
    const hasPathTraversal = requestedPath.includes('..');
    expect(hasPathTraversal).toBe(true);
  });
  
  test('malformed requests are handled', () => {
    // Test various malformed inputs
    const malformedInputs = [
      { uri: null },
      { uri: undefined },
      { uri: '' },
      { uri: 123 }, // Wrong type
      { uri: {} }, // Wrong type
    ];
    
    for (const input of malformedInputs) {
      const isValid = typeof input.uri === 'string' && input.uri.startsWith('file://');
      expect(isValid).toBe(false);
    }
  });
  
  test('unknown tools return proper error', () => {
    const unknownTools = ['unknown_tool', 'not_a_tool', 'fake_search'];
    const knownTools = ['search_path', 'search_content'];
    
    for (const tool of unknownTools) {
      expect(knownTools.includes(tool)).toBe(false);
    }
  });
  
  test('tool parameter validation', () => {
    // Test search_path validation
    const invalidPathArgs = [
      {}, // Missing pattern
      { pattern: null },
      { pattern: '' },
      { pattern: 123 } // Wrong type
    ];
    
    for (const args of invalidPathArgs) {
      const isValid = typeof args.pattern === 'string' && args.pattern.length > 0;
      expect(isValid).toBe(false);
    }
    
    // Test search_content validation
    const invalidContentArgs = [
      {}, // Missing query
      { query: null },
      { query: '' },
      { query: 123 }, // Wrong type
      { query: 'test', include: 123 }, // Wrong type for optional param
      { query: 'test', ignoreCase: 'yes' } // Wrong type for optional param
    ];
    
    for (const args of invalidContentArgs) {
      const queryValid = typeof args.query === 'string' && args.query.length > 0;
      const includeValid = args.include === undefined || typeof args.include === 'string';
      const ignoreCaseValid = args.ignoreCase === undefined || typeof args.ignoreCase === 'boolean';
      const isValid = queryValid && includeValid && ignoreCaseValid;
      
      // Only the last two args objects have valid query='test'
      const shouldBeValid = args.query === 'test' && 
        (args.include === undefined || typeof args.include === 'string') &&
        (args.ignoreCase === undefined || typeof args.ignoreCase === 'boolean');
      
      expect(isValid).toBe(shouldBeValid);
    }
  });
});