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
}