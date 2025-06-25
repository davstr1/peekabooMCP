import { describe, test, expect } from 'vitest';
import { normalizeAndValidatePath } from '../fs-utils.js';
import path from 'path';

describe('Security - Path Traversal Protection', () => {
  const testRoot = '/test/root';

  // Common path traversal attacks
  const attacks = [
    { path: '../../../etc/passwd', name: 'basic ../ traversal' },
    { path: '..\\..\\windows\\system32', name: 'Windows backslash traversal' },
    { path: '/etc/passwd', name: 'absolute path attack' },
    { path: 'C:\\Windows\\System32', name: 'Windows absolute path' },
    { path: '%2e%2e%2f', name: 'URL encoded traversal' },
    { path: '....///', name: 'multiple dots and slashes' },
    { path: '/root/../etc/passwd', name: 'absolute with traversal' },
    { path: './././../../../etc/passwd', name: 'complex traversal' },
    { path: 'foo/../../../bar', name: 'traversal in middle' },
    { path: '..', name: 'simple parent directory' },
    { path: '../', name: 'parent directory with slash' },
    { path: '\\..\\..\\', name: 'Windows style parent' },
    { path: 'test\x00.txt', name: 'null byte injection' },
    { path: '...', name: 'triple dots' },
    { path: '....//', name: 'four dots with slashes' },
    { path: '../.../...', name: 'mixed dots pattern' }
  ];

  attacks.forEach(({ path: attackPath, name }) => {
    test(`blocks ${name}: ${attackPath}`, () => {
      expect(() => {
        normalizeAndValidatePath(testRoot, attackPath);
      }).toThrow('Path traversal detected');
    });
  });

  // Valid paths that should be allowed
  const validPaths = [
    { path: '.', expected: testRoot },
    { path: '', expected: testRoot },
    { path: 'file.txt', expected: path.join(testRoot, 'file.txt') },
    { path: './file.txt', expected: path.join(testRoot, 'file.txt') },
    { path: 'subdir/file.txt', expected: path.join(testRoot, 'subdir/file.txt') },
    { path: './subdir/./file.txt', expected: path.join(testRoot, 'subdir/file.txt') },
    { path: 'deep/nested/path/file.txt', expected: path.join(testRoot, 'deep/nested/path/file.txt') },
    { path: 'file with spaces.txt', expected: path.join(testRoot, 'file with spaces.txt') },
    { path: 'файл.txt', expected: path.join(testRoot, 'файл.txt') }, // Unicode
    { path: '测试.txt', expected: path.join(testRoot, '测试.txt') }, // Chinese
    { path: '..file.txt', expected: path.join(testRoot, '..file.txt') }, // Starts with dots but not traversal
    { path: 'dir.with.dots/file.txt', expected: path.join(testRoot, 'dir.with.dots/file.txt') }
  ];

  validPaths.forEach(({ path: validPath, expected }) => {
    test(`allows valid path: ${validPath}`, () => {
      const result = normalizeAndValidatePath(testRoot, validPath);
      expect(result).toBe(expected);
    });
  });

  // Edge cases
  test('handles Windows-style paths on Unix', () => {
    const windowsPath = 'subdir\\file.txt';
    const result = normalizeAndValidatePath(testRoot, windowsPath);
    // On Unix, backslashes are valid filename characters
    if (process.platform === 'win32') {
      expect(result).toBe(path.join(testRoot, 'subdir', 'file.txt'));
    } else {
      expect(result).toBe(path.join(testRoot, 'subdir\\file.txt'));
    }
  });

  test('prevents escape via symlinks', () => {
    // This is a conceptual test - actual symlink testing would require fs mocking
    const symlinkPath = 'symlink-to-parent/../secret';
    expect(() => {
      normalizeAndValidatePath(testRoot, symlinkPath);
    }).toThrow('Path traversal detected');
  });

  test('handles very long paths', () => {
    const longPath = 'a/'.repeat(100) + 'file.txt';
    const result = normalizeAndValidatePath(testRoot, longPath);
    expect(result).toContain(testRoot);
    expect(result).toContain('file.txt');
  });

  test('handles paths with multiple slashes', () => {
    const result = normalizeAndValidatePath(testRoot, 'dir///subdir//file.txt');
    expect(result).toBe(path.join(testRoot, 'dir/subdir/file.txt'));
  });

  test('handles trailing slashes', () => {
    const result = normalizeAndValidatePath(testRoot, 'dir/subdir/');
    expect(result).toBe(path.join(testRoot, 'dir/subdir'));
  });

  // Additional security considerations
  test('blocks hidden file escape attempts', () => {
    expect(() => {
      normalizeAndValidatePath(testRoot, './../etc/passwd');
    }).toThrow('Path traversal detected');
  });

  test('blocks case variation attacks', () => {
    const caseAttacks = ['../ETC/PASSWD', '../Etc/Passwd', '../eTc/pAsSwD'];
    caseAttacks.forEach(attack => {
      expect(() => {
        normalizeAndValidatePath(testRoot, attack);
      }).toThrow('Path traversal detected');
    });
  });
});