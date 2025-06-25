import { promises as fs } from 'fs';
import path from 'path';
import { FileSystemItem } from './types.js';

interface SearchResult {
  path: string;
  matches?: Array<{
    line: number;
    content: string;
  }>;
}

/**
 * Search for files by path pattern (glob-like)
 */
export async function searchByPath(
  rootDir: string,
  pattern: string,
  items?: FileSystemItem[]
): Promise<string[]> {
  // If items not provided, get them
  if (!items) {
    const { listDirectory } = await import('./fs-utils.js');
    items = await listDirectory(rootDir, '.', true, 10);
  }

  const results: string[] = [];
  
  // Convert glob pattern to regex
  // Order matters: we process ? first to avoid breaking regex syntax added later
  let regexPattern = pattern
    .replace(/\./g, '\\.')                      // Escape dots: . → \.
    .replace(/\?/g, '[^/]')                     // ? → match single non-slash char
    .replace(/\*\*/g, '__DOUBLE_STAR__')        // ** → temporary placeholder
    .replace(/\*/g, '[^/]*')                    // * → match any non-slash chars
    .replace(/__DOUBLE_STAR__\//g, '(?:.*/)?')  // **/ → optional path (0+ dirs)
    .replace(/__DOUBLE_STAR__/g, '.*')          // ** → match anything
    .replace(/\{([^}]+)\}/g, (match, group) => {
      // {a,b,c} → (a|b|c) for alternation
      const options = group.split(',');
      return '(' + options.join('|') + ')';
    });
  
  // Handle different pattern types
  if (pattern.startsWith('**/')) {
    // Pattern like **/*.js - match anywhere
    regexPattern = regexPattern;
  } else if (pattern.includes('/')) {
    // Pattern like src/**/*.js - must match from start
    regexPattern = '^/' + regexPattern;
  } else {
    // Pattern like *.js or ?.ts - match filename in any directory
    regexPattern = '^.*/' + regexPattern;
  }
  
  const regex = new RegExp(regexPattern + '$', 'i');
  
  const searchItems = (items: FileSystemItem[]) => {
    for (const item of items) {
      // Skip node_modules and common build directories
      if (item.path.includes('/node_modules/') || 
          item.path.includes('/dist/') || 
          item.path.includes('/.git/')) {
        continue;
      }
      
      if (regex.test(item.path)) {
        results.push(item.path);
      }
      if (item.children) {
        searchItems(item.children);
      }
    }
  };
  
  searchItems(items);
  return results;
}

/**
 * Search for content within files
 */
export async function searchContent(
  rootDir: string,
  query: string,
  options: {
    include?: string;
    ignoreCase?: boolean;
    maxResults?: number;
  } = {}
): Promise<SearchResult[]> {
  const { listDirectory } = await import('./fs-utils.js');
  const items = await listDirectory(rootDir, '.', true, 10);
  
  const results: SearchResult[] = [];
  const regex = new RegExp(query, options.ignoreCase ? 'gi' : 'g');
  let resultCount = 0;
  
  const searchItems = async (items: FileSystemItem[]) => {
    for (const item of items) {
      if (options.maxResults && resultCount >= options.maxResults) {
        break;
      }
      
      if (item.type === 'file') {
        // Check if file matches include pattern
        if (options.include) {
          const includeRegex = new RegExp(
            options.include
              .replace(/\./g, '\\.')
              .replace(/\*/g, '.*')
              .replace(/\?/g, '.')
              .replace(/\{([^}]+)\}/g, (match, group) => {
                // Handle {js,ts} style patterns
                const options = group.split(',');
                return '(' + options.join('|') + ')';
              }),
            'i'
          );
          if (!includeRegex.test(item.path)) {
            continue;
          }
        }
        
        try {
          const fullPath = path.join(rootDir, item.path.slice(1)); // Remove leading /
          const content = await fs.readFile(fullPath, 'utf-8');
          const lines = content.split('\n');
          const matches: Array<{ line: number; content: string }> = [];
          
          lines.forEach((line, index) => {
            if (regex.test(line)) {
              matches.push({
                line: index + 1,
                content: line.trim()
              });
            }
          });
          
          if (matches.length > 0) {
            results.push({
              path: item.path,
              matches: matches.slice(0, 5) // Limit to 5 matches per file
            });
            resultCount++;
          }
        } catch (error) {
          // Skip files that can't be read
        }
      }
      
      if (item.children) {
        await searchItems(item.children);
      }
    }
  };
  
  await searchItems(items);
  return results;
}