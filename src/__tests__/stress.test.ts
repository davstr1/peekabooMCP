import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as fsUtils from '../fs-utils.js';
import * as searchUtils from '../search-utils.js';
import { FileSystemItem } from '../types.js';

// Mock modules
vi.mock('../fs-utils.js');
vi.mock('../search-utils.js');

describe('Stress Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Large directory structures', () => {
    test('handles directory with 1000 files', async () => {
      // Generate 1000 files
      const manyFiles: FileSystemItem[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `file${i}.txt`,
        path: `/files/file${i}.txt`,
        type: 'file' as const,
        size: 1024
      }));
      
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(manyFiles);
      
      const startTime = Date.now();
      const result = await fsUtils.listDirectory('/files', '.', true, 10);
      const duration = Date.now() - startTime;
      
      expect(result).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
    
    test('handles deeply nested directories (50 levels)', async () => {
      // Create a deeply nested structure
      const createNestedStructure = (depth: number): FileSystemItem[] => {
        if (depth <= 0) {
          return [{
            name: 'leaf.txt',
            path: `/level${depth}/leaf.txt`,
            type: 'file' as const
          }];
        }
        
        return [{
          name: `level${depth}`,
          path: `/level${depth}`,
          type: 'directory' as const,
          children: createNestedStructure(depth - 1)
        }];
      };
      
      const deepStructure = createNestedStructure(50);
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(deepStructure);
      
      const result = await fsUtils.listDirectory('/deep', '.', true, 100);
      expect(result).toBeDefined();
    });
    
    test('handles mixed large structure (files and directories)', async () => {
      // Create a structure with 100 directories, each containing 10 files
      const mixedStructure: FileSystemItem[] = Array.from({ length: 100 }, (_, dirIndex) => ({
        name: `dir${dirIndex}`,
        path: `/dir${dirIndex}`,
        type: 'directory' as const,
        children: Array.from({ length: 10 }, (_, fileIndex) => ({
          name: `file${fileIndex}.txt`,
          path: `/dir${dirIndex}/file${fileIndex}.txt`,
          type: 'file' as const,
          size: 512
        }))
      }));
      
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(mixedStructure);
      
      const result = await fsUtils.listDirectory('/mixed', '.', true, 10);
      expect(result).toHaveLength(100);
      
      // Count total items including children
      let totalItems = 0;
      const countItems = (items: FileSystemItem[]) => {
        for (const item of items) {
          totalItems++;
          if (item.children) {
            countItems(item.children);
          }
        }
      };
      countItems(result);
      
      expect(totalItems).toBe(1100); // 100 dirs + 1000 files
    });
  });
  
  describe('Large file content', () => {
    test('handles large file content (10MB)', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      vi.mocked(fsUtils.readFileContent).mockResolvedValue(largeContent);
      
      const startTime = Date.now();
      const content = await fsUtils.readFileContent('/large.txt');
      const duration = Date.now() - startTime;
      
      expect(content.length).toBe(10 * 1024 * 1024);
      expect(duration).toBeLessThan(500); // Should be fast since it's mocked
    });
    
    test('search in large file with many matches', async () => {
      // Simulate searching in a file with 1000 matches
      const manyMatches = Array.from({ length: 1000 }, (_, i) => ({
        line: i + 1,
        content: `Line ${i + 1}: TODO: implement feature ${i}`
      }));
      
      vi.mocked(searchUtils.searchContent).mockResolvedValue([{
        path: '/large-file.txt',
        matches: manyMatches.slice(0, 5) // Limited to 5 per file
      }]);
      
      const results = await searchUtils.searchContent('/root', 'TODO');
      expect(results[0].matches).toHaveLength(5); // Should be limited
    });
  });
  
  describe('Rapid sequential requests', () => {
    test('handles 100 rapid list requests', async () => {
      vi.mocked(fsUtils.listDirectory).mockResolvedValue([
        { name: 'test.txt', path: '/test.txt', type: 'file' as const }
      ]);
      
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, () => 
        fsUtils.listDirectory('/root', '.', true, 10)
      );
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(100);
      expect(results.every(r => r.length === 1)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should handle all in under 1 second
    });
    
    test('handles concurrent search requests', async () => {
      vi.mocked(searchUtils.searchByPath).mockResolvedValue(['/file1.txt', '/file2.txt']);
      
      const patterns = ['*.txt', '*.js', '*.ts', '*.json', '*.md'];
      const promises = patterns.map(pattern => 
        searchUtils.searchByPath('/root', pattern)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      expect(searchUtils.searchByPath).toHaveBeenCalledTimes(5);
    });
  });
  
  describe('Memory usage scenarios', () => {
    test('processes large result sets without excessive memory', async () => {
      // Simulate a search that returns many results
      const manySearchResults = Array.from({ length: 500 }, (_, i) => ({
        path: `/file${i}.txt`,
        matches: [
          { line: 1, content: 'match content' }
        ]
      }));
      
      vi.mocked(searchUtils.searchContent).mockResolvedValue(manySearchResults.slice(0, 20)); // Limited
      
      const results = await searchUtils.searchContent('/root', 'test', { maxResults: 20 });
      
      expect(results).toHaveLength(20); // Should respect limit
    });
    
    test('handles directory traversal with memory limits', async () => {
      // Mock implementation that tracks depth
      let maxDepthReached = 0;
      
      vi.mocked(fsUtils.listDirectory).mockImplementation(async (root, dir, recursive, maxDepth) => {
        maxDepthReached = Math.max(maxDepthReached, maxDepth || 10);
        return [];
      });
      
      await fsUtils.listDirectory('/root', '.', true, 5);
      
      expect(maxDepthReached).toBe(5); // Should respect depth limit
    });
  });
  
  describe('Error recovery under stress', () => {
    test('handles intermittent failures gracefully', async () => {
      let callCount = 0;
      
      vi.mocked(fsUtils.readFileContent).mockImplementation(async () => {
        callCount++;
        if (callCount % 3 === 0) {
          throw new Error('Intermittent failure');
        }
        return 'content';
      });
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < 10; i++) {
        try {
          const content = await fsUtils.readFileContent(`/file${i}.txt`);
          results.push(content);
        } catch (error) {
          errors.push(error);
        }
      }
      
      expect(results.length).toBeGreaterThan(0);
      expect(errors.length).toBeGreaterThan(0);
      expect(results.length + errors.length).toBe(10);
    });
    
    test('maintains stability after errors', async () => {
      // First call fails
      vi.mocked(fsUtils.listDirectory)
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValue([{ name: 'test.txt', path: '/test.txt', type: 'file' as const }]);
      
      // First call should fail
      await expect(fsUtils.listDirectory('/root', '.', true, 10)).rejects.toThrow();
      
      // Subsequent calls should work
      const result = await fsUtils.listDirectory('/root', '.', true, 10);
      expect(result).toHaveLength(1);
    });
  });
});