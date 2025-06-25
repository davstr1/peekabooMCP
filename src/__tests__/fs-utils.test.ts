import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { listDirectory, readFileContent, normalizeAndValidatePath } from '../fs-utils.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    stat: vi.fn(),
    readFile: vi.fn()
  }
}));

describe('fs-utils', () => {
  const mockRoot = '/test/root';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeAndValidatePath (non-security)', () => {
    test('normalizes . to root directory', () => {
      const result = normalizeAndValidatePath(mockRoot, '.');
      expect(result).toBe(path.resolve(mockRoot));
    });

    test('handles empty string path', () => {
      const result = normalizeAndValidatePath(mockRoot, '');
      expect(result).toBe(path.resolve(mockRoot));
    });

    test('handles paths with trailing slashes', () => {
      const result = normalizeAndValidatePath(mockRoot, 'dir/subdir/');
      expect(result).toBe(path.join(path.resolve(mockRoot), 'dir/subdir'));
    });

    test('handles paths with multiple slashes', () => {
      const result = normalizeAndValidatePath(mockRoot, 'dir///subdir//file.txt');
      expect(result).toBe(path.join(path.resolve(mockRoot), 'dir/subdir/file.txt'));
    });
  });

  describe('listDirectory', () => {
    const mockDirContents = [
      { name: 'file1.txt', isDirectory: () => false },
      { name: 'file2.js', isDirectory: () => false },
      { name: 'subdir', isDirectory: () => true }
    ];

    const mockStats = {
      size: 1024,
      mtime: new Date('2024-01-01')
    };

    beforeEach(() => {
      vi.mocked(fs.readdir).mockResolvedValue(mockDirContents as any);
      vi.mocked(fs.stat).mockResolvedValue(mockStats as any);
    });

    test('lists files in root directory', async () => {
      const result = await listDirectory(mockRoot, '.', false);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        name: 'file1.txt',
        path: '/file1.txt',
        type: 'file',
        size: 1024
      });
      expect(result[1]).toMatchObject({
        name: 'file2.js',
        path: '/file2.js',
        type: 'file'
      });
      expect(result[2]).toMatchObject({
        name: 'subdir',
        path: '/subdir',
        type: 'directory'
      });
    });

    test('lists nested directories when recursive=true', async () => {
      const nestedContents = [
        { name: 'nested.txt', isDirectory: () => false }
      ];
      
      vi.mocked(fs.readdir)
        .mockResolvedValueOnce(mockDirContents as any)
        .mockResolvedValueOnce(nestedContents as any);

      const result = await listDirectory(mockRoot, '.', true, 10);
      
      expect(result).toHaveLength(3);
      expect(result[2].children).toBeDefined();
      expect(result[2].children).toHaveLength(1);
      expect(result[2].children![0]).toMatchObject({
        name: 'nested.txt',
        path: '/subdir/nested.txt',
        type: 'file'
      });
    });

    test('respects maxDepth parameter', async () => {
      vi.mocked(fs.readdir).mockResolvedValue(mockDirContents as any);
      
      const result = await listDirectory(mockRoot, '.', true, 0);
      
      // Should not recurse into subdirectories when maxDepth is 0
      expect(result[2].children).toBeUndefined();
      expect(vi.mocked(fs.readdir)).toHaveBeenCalledTimes(1);
    });

    test('stops at depth 1 when recursive=false', async () => {
      const result = await listDirectory(mockRoot, '.', false);
      
      expect(result[2].children).toBeUndefined();
      expect(vi.mocked(fs.readdir)).toHaveBeenCalledTimes(1);
    });

    test('handles empty directories', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([]);
      
      const result = await listDirectory(mockRoot, '.');
      
      expect(result).toHaveLength(0);
    });

    test('handles permission denied errors gracefully', async () => {
      const permissionError = new Error('Permission denied');
      (permissionError as any).code = 'EACCES';
      
      vi.mocked(fs.stat)
        .mockResolvedValueOnce(mockStats as any)
        .mockRejectedValueOnce(permissionError);
      
      const result = await listDirectory(mockRoot, '.');
      
      // Should still return the items, but without full metadata
      expect(result).toHaveLength(3);
      expect(result[1].size).toBeUndefined();
    });

    test('returns correct file metadata', async () => {
      const detailedStats = {
        size: 2048,
        mtime: new Date('2024-12-25T10:30:00Z'),
        isFile: () => true,
        isDirectory: () => false
      };
      
      vi.mocked(fs.stat).mockResolvedValue(detailedStats as any);
      
      const result = await listDirectory(mockRoot, '.');
      
      expect(result[0]).toMatchObject({
        size: 2048,
        modified: new Date('2024-12-25T10:30:00Z')
      });
    });

    test('throws error for non-existent directory', async () => {
      const notFoundError = new Error('Not found');
      (notFoundError as any).code = 'ENOENT';
      
      vi.mocked(fs.readdir).mockRejectedValue(notFoundError);
      
      await expect(listDirectory(mockRoot, 'nonexistent')).rejects.toThrow('Directory not found');
    });

    test('throws error when path is not a directory', async () => {
      const notDirError = new Error('Not a directory');
      (notDirError as any).code = 'ENOTDIR';
      
      vi.mocked(fs.readdir).mockRejectedValue(notDirError);
      
      await expect(listDirectory(mockRoot, 'file.txt')).rejects.toThrow('Not a directory');
    });
  });

  describe('readFileContent', () => {
    test('reads text file content', async () => {
      const fileContent = 'Hello, world!\nThis is a test file.';
      vi.mocked(fs.readFile).mockResolvedValue(fileContent);
      
      const result = await readFileContent('/test/file.txt');
      
      expect(result).toBe(fileContent);
      expect(vi.mocked(fs.readFile)).toHaveBeenCalledWith('/test/file.txt', 'utf-8');
    });

    test('throws error for non-existent file', async () => {
      const notFoundError = new Error('File not found');
      (notFoundError as any).code = 'ENOENT';
      
      vi.mocked(fs.readFile).mockRejectedValue(notFoundError);
      
      await expect(readFileContent('/test/missing.txt')).rejects.toThrow('File not found');
    });

    test('throws error for directory', async () => {
      const isDirError = new Error('Is a directory');
      (isDirError as any).code = 'EISDIR';
      
      vi.mocked(fs.readFile).mockRejectedValue(isDirError);
      
      await expect(readFileContent('/test/directory')).rejects.toThrow('Cannot read directory as file');
    });

    test('handles permission denied', async () => {
      const permError = new Error('Permission denied');
      (permError as any).code = 'EACCES';
      
      vi.mocked(fs.readFile).mockRejectedValue(permError);
      
      await expect(readFileContent('/test/secret.txt')).rejects.toThrow('Permission denied');
    });

    test('propagates other errors', async () => {
      const unknownError = new Error('Disk error');
      
      vi.mocked(fs.readFile).mockRejectedValue(unknownError);
      
      await expect(readFileContent('/test/file.txt')).rejects.toThrow('Disk error');
    });
  });
});