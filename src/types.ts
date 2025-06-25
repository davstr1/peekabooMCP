export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  children?: FileSystemItem[];
}

export interface ServerConfig {
  recursive?: boolean;
  maxDepth?: number;
  timeout?: number; // Timeout in milliseconds
  maxFileSize?: number; // Maximum file size in bytes
  maxTotalSize?: number; // Maximum total size for directory listing in bytes
}