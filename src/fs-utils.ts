import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemItem } from './types.js';

export function normalizeAndValidatePath(rootDir: string, requestedPath: string): string {
  const normalizedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(normalizedRoot, requestedPath);
  
  if (!resolvedPath.startsWith(normalizedRoot)) {
    throw new Error('Path traversal detected: Access outside root directory is not allowed');
  }
  
  return resolvedPath;
}

export async function listDirectory(rootDir: string, relativePath: string): Promise<FileSystemItem[]> {
  const fullPath = normalizeAndValidatePath(rootDir, relativePath);
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const items: FileSystemItem[] = [];
    
    for (const entry of entries) {
      const itemPath = path.join(fullPath, entry.name);
      const relativeItemPath = path.relative(rootDir, itemPath);
      
      try {
        const stats = await fs.stat(itemPath);
        items.push({
          name: entry.name,
          path: `/${relativeItemPath}`,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        });
      } catch (error) {
        items.push({
          name: entry.name,
          path: `/${relativeItemPath}`,
          type: entry.isDirectory() ? 'directory' : 'file'
        });
      }
    }
    
    return items;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Directory not found: ${relativePath}`);
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOTDIR') {
      throw new Error(`Not a directory: ${relativePath}`);
    }
    throw error;
  }
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if ((error as NodeJS.ErrnoException).code === 'EISDIR') {
      throw new Error(`Cannot read directory as file: ${filePath}`);
    }
    throw error;
  }
}