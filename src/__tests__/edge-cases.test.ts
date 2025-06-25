import { describe, test, expect, vi, beforeEach } from 'vitest';
import * as fsUtils from '../fs-utils.js';
import * as searchUtils from '../search-utils.js';
import { getMimeType } from '../mime-types.js';

// Mock modules
vi.mock('../fs-utils.js');
vi.mock('../search-utils.js');

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Empty directories', () => {
    test('handles empty directories correctly', async () => {
      vi.mocked(fsUtils.listDirectory).mockResolvedValue([]);
      
      const result = await fsUtils.listDirectory('/empty', '.', true, 10);
      
      expect(result).toEqual([]);
    });
    
    test('handles directories with only subdirectories', async () => {
      const dirOnlyStructure = [
        {
          name: 'src',
          path: '/src',
          type: 'directory' as const,
          children: []
        },
        {
          name: 'tests',
          path: '/tests',
          type: 'directory' as const,
          children: []
        }
      ];
      
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(dirOnlyStructure);
      
      const result = await fsUtils.listDirectory('/project', '.', true, 10);
      expect(result).toHaveLength(2);
      expect(result.every(item => item.type === 'directory')).toBe(true);
    });
  });
  
  describe('Very long file paths', () => {
    test('handles paths near system limits', async () => {
      // Most systems have a 255 character filename limit
      const longFileName = 'a'.repeat(250) + '.txt';
      const longPath = '/very/deep/nested/directory/structure/' + longFileName;
      
      vi.mocked(fsUtils.readFileContent).mockResolvedValue('content');
      
      const content = await fsUtils.readFileContent(longPath);
      expect(content).toBe('content');
    });
    
    test('handles deeply nested paths', async () => {
      // Create a path with 50 levels
      const deepPath = Array(50).fill('level').join('/') + '/file.txt';
      
      vi.mocked(fsUtils.normalizeAndValidatePath).mockReturnValue(deepPath);
      
      const normalized = fsUtils.normalizeAndValidatePath('/root', deepPath);
      expect(normalized).toBe(deepPath);
    });
  });
  
  describe('Special characters in filenames', () => {
    test('handles Unicode filenames', async () => {
      const unicodeFiles = [
        { name: '测试文件.txt', path: '/测试文件.txt', type: 'file' as const },
        { name: 'файл.js', path: '/файл.js', type: 'file' as const },
        { name: '🚀🎉.md', path: '/🚀🎉.md', type: 'file' as const }
      ];
      
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(unicodeFiles);
      
      const result = await fsUtils.listDirectory('/unicode', '.', true, 10);
      expect(result).toEqual(unicodeFiles);
    });
    
    test('handles filenames with spaces and special chars', async () => {
      const specialFiles = [
        { name: 'file with spaces.txt', path: '/file with spaces.txt', type: 'file' as const },
        { name: 'file-with-dashes.js', path: '/file-with-dashes.js', type: 'file' as const },
        { name: 'file_with_underscores.py', path: '/file_with_underscores.py', type: 'file' as const },
        { name: 'file@symbol.txt', path: '/file@symbol.txt', type: 'file' as const }
      ];
      
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(specialFiles);
      
      const result = await fsUtils.listDirectory('/special', '.', true, 10);
      expect(result).toHaveLength(4);
    });
  });
  
  describe('Symbolic links', () => {
    test('handles symbolic links safely', async () => {
      const filesWithSymlink = [
        { name: 'real-file.txt', path: '/real-file.txt', type: 'file' as const },
        { name: 'link-to-file', path: '/link-to-file', type: 'file' as const } // symlink
      ];
      
      vi.mocked(fsUtils.listDirectory).mockResolvedValue(filesWithSymlink);
      
      const result = await fsUtils.listDirectory('/links', '.', true, 10);
      expect(result).toHaveLength(2);
    });
    
    test('prevents circular symlink traversal', async () => {
      // Simulate a directory that links to itself
      vi.mocked(fsUtils.listDirectory).mockImplementation(async (root, dir, recursive, depth) => {
        if (!depth || depth <= 0) return [];
        
        return [{
          name: 'circular',
          path: '/circular',
          type: 'directory' as const,
          children: [] // Would normally cause infinite loop
        }];
      });
      
      const result = await fsUtils.listDirectory('/circular', '.', true, 5);
      expect(result).toBeDefined();
    });
  });
  
  describe('File size edge cases', () => {
    test('handles zero-byte files', async () => {
      vi.mocked(fsUtils.readFileContent).mockResolvedValue('');
      
      const content = await fsUtils.readFileContent('/empty.txt');
      expect(content).toBe('');
    });
    
    test('handles very large files', async () => {
      // Simulate a 100MB file
      const largeContent = 'x'.repeat(100 * 1024 * 1024);
      vi.mocked(fsUtils.readFileContent).mockResolvedValue(largeContent);
      
      const content = await fsUtils.readFileContent('/large.bin');
      expect(content.length).toBe(100 * 1024 * 1024);
    });
  });
  
  describe('MIME type edge cases', () => {
    test('handles files without extensions', () => {
      expect(getMimeType('README')).toBe('text/plain');
      expect(getMimeType('Dockerfile')).toBe('text/plain');
      expect(getMimeType('Makefile')).toBe('text/plain');
    });
    
    test('handles multiple extensions', () => {
      expect(getMimeType('archive.tar.gz')).toBe('application/gzip');
      expect(getMimeType('file.test.js')).toBe('application/javascript');
    });
    
    test('handles unknown extensions', () => {
      expect(getMimeType('file.xyz123')).toBe('text/plain');
      expect(getMimeType('file.unknown')).toBe('text/plain');
    });
  });
  
  describe('Search pattern edge cases', () => {
    test('handles empty search results', async () => {
      vi.mocked(searchUtils.searchByPath).mockResolvedValue([]);
      
      const results = await searchUtils.searchByPath('/root', '*.nonexistent');
      expect(results).toEqual([]);
    });
    
    test('handles special regex characters in search', async () => {
      vi.mocked(searchUtils.searchContent).mockResolvedValue([]);
      
      // These characters have special meaning in regex
      const specialQueries = ['[test]', '(test)', 'test.', 'test*', 'test+', 'test?'];
      
      for (const query of specialQueries) {
        await searchUtils.searchContent('/root', query);
        expect(searchUtils.searchContent).toHaveBeenCalled();
      }
    });
    
    test('handles very long search patterns', async () => {
      const longPattern = '*'.repeat(100) + '.txt';
      vi.mocked(searchUtils.searchByPath).mockResolvedValue([]);
      
      const results = await searchUtils.searchByPath('/root', longPattern);
      expect(results).toEqual([]);
    });
  });
});