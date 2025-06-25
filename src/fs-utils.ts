import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemItem } from './types.js';
import { ResourceManager } from './resource-manager.js';

export function normalizeAndValidatePath(rootDir: string, requestedPath: string): string {
  // Reject obvious traversal patterns before resolution
  const dangerousPatterns = [
    /\.\.[\/\\]/,           // ../ or ..\
    /^\.\.$/, // Just ..
    /^\.\.\//, // Starts with ../
    /\x00/,                 // Null bytes
    /^[a-zA-Z]:[\\\/]/,     // Windows absolute paths like C:\ or C:/
    /^[\/\\]/,              // Absolute paths starting with / or \
    /%2e%2e/i,              // URL encoded dots
    /\.\.\./,               // Three or more dots
    /[\/\\]\.\.[\/\\]/      // /../ or \..\
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(requestedPath)) {
      throw new Error('Path traversal detected: Access outside root directory is not allowed');
    }
  }

  const normalizedRoot = path.resolve(rootDir);
  const resolvedPath = path.resolve(normalizedRoot, requestedPath);
  
  // Double-check after resolution
  if (!resolvedPath.startsWith(normalizedRoot)) {
    throw new Error('Path traversal detected: Access outside root directory is not allowed');
  }
  
  // No need for additional .. check since we already validated the resolved path
  
  return resolvedPath;
}

export async function listDirectory(
  rootDir: string, 
  relativePath: string, 
  recursive: boolean = true,
  maxDepth: number = 10,
  currentDepth: number = 0,
  resourceManager?: ResourceManager
): Promise<FileSystemItem[]> {
  const fullPath = normalizeAndValidatePath(rootDir, relativePath);
  
  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const items: FileSystemItem[] = [];
    
    for (const entry of entries) {
      const itemPath = path.join(fullPath, entry.name);
      const relativeItemPath = path.relative(rootDir, itemPath);
      
      try {
        const stats = await fs.stat(itemPath);
        
        // Track size for resource management
        if (resourceManager && stats.size) {
          resourceManager.trackSize(stats.size);
        }
        
        const item: FileSystemItem = {
          name: entry.name,
          path: `/${relativeItemPath}`,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime
        };
        
        // Recursively list subdirectories if enabled and within depth limit
        if (recursive && entry.isDirectory() && currentDepth < maxDepth) {
          item.children = await listDirectory(
            rootDir, 
            relativeItemPath, 
            recursive, 
            maxDepth, 
            currentDepth + 1,
            resourceManager
          );
        }
        
        items.push(item);
      } catch (error) {
        // Handle permission errors or inaccessible files
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
      throw new Error('Directory not found');
    }
    if ((error as NodeJS.ErrnoException).code === 'ENOTDIR') {
      throw new Error(`Not a directory: ${relativePath}`);
    }
    throw error;
  }
}

export async function readFileContent(filePath: string, resourceManager?: ResourceManager): Promise<string> {
  try {
    // Check file size before reading
    if (resourceManager) {
      const stats = await fs.stat(filePath);
      resourceManager.checkFileSize(stats.size, filePath);
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('File not found');
    }
    if ((error as NodeJS.ErrnoException).code === 'EISDIR') {
      throw new Error(`Cannot read directory as file: ${filePath}`);
    }
    throw error;
  }
}