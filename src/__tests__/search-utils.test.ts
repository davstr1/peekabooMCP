import { describe, test, expect, vi, beforeEach } from 'vitest';
import { searchByPath, searchContent } from '../search-utils.js';
import { FileSystemItem } from '../types.js';

// Mock fs-utils
vi.mock('../fs-utils.js', () => ({
  listDirectory: vi.fn()
}));

// Mock fs for searchContent
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    stat: vi.fn()
  }
}));

describe('search-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchByPath', () => {
    const mockFileStructure: FileSystemItem[] = [
      {
        name: 'index.ts',
        path: '/index.ts',
        type: 'file'
      },
      {
        name: 'test.js',
        path: '/test.js',
        type: 'file'
      },
      {
        name: 'src',
        path: '/src',
        type: 'directory',
        children: [
          {
            name: 'main.ts',
            path: '/src/main.ts',
            type: 'file'
          },
          {
            name: 'utils.js',
            path: '/src/utils.js',
            type: 'file'
          },
          {
            name: 'components',
            path: '/src/components',
            type: 'directory',
            children: [
              {
                name: 'Button.tsx',
                path: '/src/components/Button.tsx',
                type: 'file'
              }
            ]
          }
        ]
      },
      {
        name: 'package.json',
        path: '/package.json',
        type: 'file'
      },
      {
        name: 'node_modules',
        path: '/node_modules',
        type: 'directory',
        children: [
          {
            name: 'react',
            path: '/node_modules/react',
            type: 'directory'
          }
        ]
      },
      {
        name: 'dist',
        path: '/dist',
        type: 'directory',
        children: [
          {
            name: 'bundle.js',
            path: '/dist/bundle.js',
            type: 'file'
          }
        ]
      }
    ];

    test('matches simple wildcards: *.ts', async () => {
      const result = await searchByPath('/root', '*.ts', mockFileStructure);
      
      // *.ts matches any .ts file in any directory
      expect(result).toContain('/index.ts');
      expect(result).toContain('/src/main.ts');
      expect(result).not.toContain('/test.js');
    });

    test('matches recursive wildcards: **/*.json', async () => {
      const result = await searchByPath('/root', '**/*.json', mockFileStructure);
      
      expect(result).toEqual([
        '/package.json'
      ]);
    });

    test('matches directory patterns: src/**/*.js', async () => {
      const result = await searchByPath('/root', 'src/**/*.js', mockFileStructure);
      
      expect(result).toEqual([
        '/src/utils.js'
      ]);
    });

    test('excludes node_modules automatically', async () => {
      const result = await searchByPath('/root', '**/*', mockFileStructure);
      
      expect(result).not.toContain('/node_modules/react');
      expect(result).toContain('/src/main.ts');
    });

    test('excludes dist directory', async () => {
      const result = await searchByPath('/root', '*.js', mockFileStructure);
      
      expect(result).not.toContain('/dist/bundle.js');
      expect(result).toContain('/test.js');
    });

    test('excludes .git directory', async () => {
      const withGit = [...mockFileStructure, {
        name: '.git',
        path: '/.git',
        type: 'directory' as const,
        children: [{
          name: 'config',
          path: '/.git/config',
          type: 'file' as const
        }]
      }];
      
      const result = await searchByPath('/root', '**/*', withGit);
      
      expect(result).not.toContain('/.git/config');
    });

    test('case insensitive matching', async () => {
      const result = await searchByPath('/root', '*.TSX', mockFileStructure);
      
      expect(result).toContain('/src/components/Button.tsx');
    });

    test('handles patterns with question marks', async () => {
      const withTestFiles = [...mockFileStructure, {
        name: 'a.ts',
        path: '/a.ts',
        type: 'file' as const
      }, {
        name: 'ab.ts',
        path: '/ab.ts',
        type: 'file' as const
      }];
      
      const result = await searchByPath('/root', '?.ts', withTestFiles);
      
      expect(result).toContain('/a.ts');
      expect(result).not.toContain('/ab.ts');
    });

    test('fetches directory structure if not provided', async () => {
      const { listDirectory } = await import('../fs-utils.js');
      vi.mocked(listDirectory).mockResolvedValue(mockFileStructure);
      
      const result = await searchByPath('/root', '*.ts');
      
      expect(listDirectory).toHaveBeenCalledWith('/root', '.', true, 10);
      expect(result).toContain('/index.ts');
    });
  });

  describe('searchContent', () => {
    const mockFiles = [
      { path: '/file1.txt', content: 'Hello world\nThis is a test\nTODO: fix this' },
      { path: '/file2.js', content: 'function test() {\n  // TODO: implement\n  return true;\n}' },
      { path: '/README.md', content: '# Project\n\nTODO: Add documentation' },
      { path: '/binary.png', content: null } // Binary file
    ];

    beforeEach(async () => {
      const { listDirectory } = await import('../fs-utils.js');
      const fs = await import('fs');
      
      const fileStructure = mockFiles.map(f => ({
        name: f.path.split('/').pop()!,
        path: f.path,
        type: 'file' as const
      }));
      
      vi.mocked(listDirectory).mockResolvedValue(fileStructure);
      
      vi.mocked(fs.promises.readFile).mockImplementation((path: any) => {
        const pathStr = typeof path === 'string' ? path : path.toString();
        const file = mockFiles.find(f => pathStr.includes(f.path.slice(1)));
        if (file?.content === null) {
          return Promise.reject(new Error('Invalid UTF-8'));
        }
        return Promise.resolve(file?.content || '') as any;
      });
      
      vi.mocked(fs.promises.stat).mockImplementation((path: any) => {
        const pathStr = typeof path === 'string' ? path : path.toString();
        const file = mockFiles.find(f => pathStr.includes(f.path.slice(1)));
        // Mock file size based on content length (or small default)
        const size = file?.content ? file.content.length : 100;
        return Promise.resolve({ size } as any);
      });
    });

    test('finds simple text in files', async () => {
      const results = await searchContent('/root', 'TODO');
      
      expect(results).toHaveLength(3);
      expect(results[0]).toMatchObject({
        path: '/file1.txt',
        matches: expect.arrayContaining([
          expect.objectContaining({
            line: 3,
            content: 'TODO: fix this'
          })
        ])
      });
    });

    test('returns correct line numbers', async () => {
      const results = await searchContent('/root', 'TODO');
      
      const jsResult = results.find(r => r.path === '/file2.js');
      expect(jsResult?.matches?.[0]).toMatchObject({
        line: 2,
        content: '// TODO: implement'
      });
    });

    test('respects include pattern filter', async () => {
      const results = await searchContent('/root', 'TODO', { include: '*.js' });
      
      expect(results).toHaveLength(1);
      expect(results[0].path).toBe('/file2.js');
    });

    test('handles ignoreCase flag correctly', async () => {
      const caseSensitive = await searchContent('/root', 'todo', { ignoreCase: false });
      expect(caseSensitive).toHaveLength(0);
      
      const caseInsensitive = await searchContent('/root', 'todo', { ignoreCase: true });
      expect(caseInsensitive).toHaveLength(3);
    });

    test('limits results to maxResults', async () => {
      const results = await searchContent('/root', 'TODO', { maxResults: 2 });
      
      expect(results).toHaveLength(2);
    });

    test('skips binary files', async () => {
      const results = await searchContent('/root', 'TODO');
      
      const paths = results.map(r => r.path);
      expect(paths).not.toContain('/binary.png');
    });

    test('handles file read errors gracefully', async () => {
      const fs = await import('fs');
      vi.mocked(fs.promises.readFile).mockRejectedValueOnce(new Error('Permission denied'));
      
      const results = await searchContent('/root', 'TODO');
      
      // Should skip the file with error and continue
      expect(results.length).toBeGreaterThan(0);
    });

    test('limits matches per file to 5', async () => {
      const fs = await import('fs');
      const contentWithManyMatches = 'TODO\n'.repeat(10);
      vi.mocked(fs.promises.readFile).mockResolvedValueOnce(contentWithManyMatches);
      
      const results = await searchContent('/root', 'TODO');
      
      expect(results[0].matches).toHaveLength(5);
    });

    test('handles complex include patterns', async () => {
      const results = await searchContent('/root', 'TODO', { include: '*.{js,md}' });
      
      const paths = results.map(r => r.path);
      expect(paths).toContain('/file2.js');
      expect(paths).toContain('/README.md');
      expect(paths).not.toContain('/file1.txt');
    });
  });
});