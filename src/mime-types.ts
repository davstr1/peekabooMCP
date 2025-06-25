const MIME_TYPES: Record<string, string> = {
  // Text
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.htm': 'text/html',
  '.css': 'text/css',
  '.csv': 'text/csv',
  
  // Code
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.ts': 'application/typescript',
  '.tsx': 'application/typescript',
  '.jsx': 'text/jsx',
  '.json': 'application/json',
  '.py': 'text/x-python',
  '.java': 'text/x-java',
  '.c': 'text/x-c',
  '.cpp': 'text/x-c++',
  '.h': 'text/x-c',
  '.hpp': 'text/x-c++',
  '.rs': 'text/x-rust',
  '.go': 'text/x-go',
  '.rb': 'text/x-ruby',
  '.php': 'text/x-php',
  '.sh': 'text/x-sh',
  '.bash': 'text/x-sh',
  '.zsh': 'text/x-sh',
  '.fish': 'text/x-sh',
  '.ps1': 'text/x-powershell',
  '.yaml': 'text/yaml',
  '.yml': 'text/yaml',
  '.toml': 'text/toml',
  '.xml': 'text/xml',
  '.sql': 'text/x-sql',
  
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Archives
  '.zip': 'application/zip',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  
  // Other
  '.log': 'text/plain',
  '.conf': 'text/plain',
  '.config': 'text/plain',
  '.ini': 'text/plain',
  '.env': 'text/plain',
};

export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext && MIME_TYPES[ext] || 'text/plain';
}